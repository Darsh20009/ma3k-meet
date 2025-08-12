import { useRef, useEffect, useState, useCallback } from 'react';

interface WebRTCPeer {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface UseWebRTCProps {
  meetingId: string;
  userId?: string;
  userName: string;
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onUserLeft?: (userId: string) => void;
}

export function useWebRTC({ meetingId, userId, userName, onRemoteStream, onUserLeft }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [peers, setPeers] = useState<Map<string, WebRTCPeer>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ICE servers configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Initialize WebSocket connection for signaling
  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Join WebRTC room
      ws.send(JSON.stringify({
        type: 'join_webrtc',
        meetingId,
        userId,
        userName
      }));
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'webrtc_user_joined':
          if (message.userId !== userId) {
            await createPeerConnection(message.userId, true);
          }
          break;
          
        case 'webrtc_offer':
          await handleOffer(message.userId, message.offer);
          break;
          
        case 'webrtc_answer':
          await handleAnswer(message.userId, message.answer);
          break;
          
        case 'webrtc_ice_candidate':
          await handleIceCandidate(message.userId, message.candidate);
          break;
          
        case 'webrtc_user_left':
          handleUserLeft(message.userId);
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [meetingId, userId, userName]);

  // Create peer connection
  const createPeerConnection = useCallback(async (remoteUserId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers });
    
    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && onRemoteStream) {
        onRemoteStream(remoteUserId, remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          meetingId,
          userId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        }));
      }
    };

    const peer: WebRTCPeer = {
      id: remoteUserId,
      connection: pc
    };

    setPeers(prev => new Map(prev).set(remoteUserId, peer));

    // If initiator, create offer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_offer',
          meetingId,
          userId,
          targetUserId: remoteUserId,
          offer
        }));
      }
    }

    return pc;
  }, [localStream, meetingId, userId, onRemoteStream]);

  // Handle incoming offer
  const handleOffer = useCallback(async (remoteUserId: string, offer: RTCSessionDescriptionInit) => {
    let peer = peers.get(remoteUserId);
    
    if (!peer) {
      const pc = await createPeerConnection(remoteUserId, false);
      peer = peers.get(remoteUserId);
      if (!peer) return;
    }

    await peer.connection.setRemoteDescription(offer);
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'webrtc_answer',
        meetingId,
        userId,
        targetUserId: remoteUserId,
        answer
      }));
    }
  }, [peers, createPeerConnection, meetingId, userId]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (remoteUserId: string, answer: RTCSessionDescriptionInit) => {
    const peer = peers.get(remoteUserId);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }, [peers]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (remoteUserId: string, candidate: RTCIceCandidateInit) => {
    const peer = peers.get(remoteUserId);
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, [peers]);

  // Handle user left
  const handleUserLeft = useCallback((remoteUserId: string) => {
    const peer = peers.get(remoteUserId);
    if (peer) {
      peer.connection.close();
      setPeers(prev => {
        const newPeers = new Map(prev);
        newPeers.delete(remoteUserId);
        return newPeers;
      });
      
      if (onUserLeft) {
        onUserLeft(remoteUserId);
      }
    }
  }, [peers, onUserLeft]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: isAudioEnabled 
      });
      
      setLocalStream(stream);
      setIsVideoEnabled(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to existing peer connections
      peers.forEach(peer => {
        stream.getTracks().forEach(track => {
          peer.connection.addTrack(track, stream);
        });
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, [isAudioEnabled, peers]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.stop();
        // Remove track from peer connections
        peers.forEach(peer => {
          const sender = peer.connection.getSenders().find(s => s.track === track);
          if (sender) {
            peer.connection.removeTrack(sender);
          }
        });
      });
      
      setIsVideoEnabled(false);
      
      // Update stream without video
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioOnlyStream = new MediaStream(audioTracks);
        setLocalStream(audioOnlyStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = audioOnlyStream;
        }
      } else {
        setLocalStream(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    }
  }, [localStream, peers]);

  // Start microphone
  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideoEnabled, 
        audio: true 
      });
      
      setLocalStream(stream);
      setIsAudioEnabled(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to existing peer connections
      peers.forEach(peer => {
        stream.getTracks().forEach(track => {
          peer.connection.addTrack(track, stream);
        });
      });

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [isVideoEnabled, peers]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.stop();
        // Remove track from peer connections
        peers.forEach(peer => {
          const sender = peer.connection.getSenders().find(s => s.track === track);
          if (sender) {
            peer.connection.removeTrack(sender);
          }
        });
      });
      
      setIsAudioEnabled(false);
      
      // Update stream without audio
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoOnlyStream = new MediaStream(videoTracks);
        setLocalStream(videoOnlyStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = videoOnlyStream;
        }
      } else {
        setLocalStream(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    }
  }, [localStream, peers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      peers.forEach(peer => peer.connection.close());
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    localStream,
    localVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    startCamera,
    stopCamera,
    startMicrophone,
    stopMicrophone,
    peers: Array.from(peers.values())
  };
}