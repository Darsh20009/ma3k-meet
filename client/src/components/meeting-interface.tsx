import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import ParticipantManagement from "./participant-management";
import ChatSidebar from "./chat-sidebar";
import MeetingCodeDisplay from "./meeting-code-display";
import QuickReactions from "./quick-reactions";
import VirtualParticipantsControlPanel, { VirtualParticipantSettings } from "./virtual-participants-control-panel";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Meeting, VirtualParticipant } from "@shared/schema";
import { RealisticBehaviorSimulator, VirtualParticipantMessageGenerator } from "@/lib/realistic-behavior";

interface MeetingInterfaceProps {
  meeting: Meeting;
  onLeave: () => void;
}

export default function MeetingInterface({ meeting, onLeave }: MeetingInterfaceProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  const { isConnected, messages, realUsers, sendMessage, setMessages, setRealUsers } = useWebSocket(meeting.id);
  
  // Session users tracking for real-time collaboration
  const [sessionUsers, setSessionUsers] = useState<{id: string, name: string, joinedAt: Date}[]>([]);
  
  // Realistic behavior simulation
  const [behaviorSimulator, setBehaviorSimulator] = useState<RealisticBehaviorSimulator | null>(null);
  const [messageGenerator, setMessageGenerator] = useState<VirtualParticipantMessageGenerator | null>(null);
  const [showVirtualControlPanel, setShowVirtualControlPanel] = useState(false);
  const [virtualSettings, setVirtualSettings] = useState<VirtualParticipantSettings | null>(null);

  // Meeting timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize media stream when joining meeting
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: false, 
          audio: true 
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.log('Could not access media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch meeting participants
  const { data: participants = [] } = useQuery<VirtualParticipant[]>({
    queryKey: [`/api/meetings/${meeting.id}/participants`],
    enabled: isConnected
  });

  // Fetch session users for real-time collaboration
  const { data: sessionUsersData = [] } = useQuery<{id: string, name: string, joinedAt: Date}[]>({
    queryKey: [`/api/meetings/${meeting.id}/session-users`],
    refetchInterval: 3000, // Refresh every 3 seconds
    enabled: isConnected
  });

  useEffect(() => {
    setSessionUsers(sessionUsersData);
  }, [sessionUsersData]);

  // Initialize realistic behavior simulation when participants are loaded
  useEffect(() => {
    if (participants.length > 0) {
      // Initialize behavior simulator
      const simulator = new RealisticBehaviorSimulator(participants);
      setBehaviorSimulator(simulator);

      // Initialize message generator
      const generator = new VirtualParticipantMessageGenerator(
        participants,
        (participantId: string, message: string) => {
          const participant = participants.find(p => p.id === participantId);
          if (participant) {
            sendMessage(message, participant.name, participant.avatar);
          }
        }
      );
      setMessageGenerator(generator);

      // Cleanup on unmount
      return () => {
        simulator.destroy();
        generator.destroy();
      };
    }
  }, [participants, sendMessage]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMicrophone = async () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = !isMicOn;
        });
        setIsMicOn(!isMicOn);
        toast({
          title: isMicOn ? "تم كتم الصوت" : "تم تفعيل الصوت",
          description: isMicOn ? "لن يسمعك الآخرون" : "يمكن للآخرين سماعك الآن",
        });
      }
    } else if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: isVideoOn, 
          audio: true 
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsMicOn(true);
        toast({
          title: "تم تفعيل الصوت",
          description: "يمكن للآخرين سماعك الآن",
        });
      } catch (error) {
        toast({
          title: "خطأ في الصوت",
          description: "تعذر الوصول للميكروفون",
          variant: "destructive"
        });
      }
    }
  };
  
  const toggleVideo = async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = !isVideoOn;
        });
        setIsVideoOn(!isVideoOn);
        toast({
          title: isVideoOn ? "تم إيقاف الكاميرا" : "تم تشغيل الكاميرا",
          description: isVideoOn ? "لن يراك الآخرون" : "يمكن للآخرين رؤيتك الآن",
        });
      } else if (!isVideoOn) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: isMicOn 
          });
          // Stop old stream
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
          }
          setLocalStream(newStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
          setIsVideoOn(true);
          toast({
            title: "تم تشغيل الكاميرا",
            description: "يمكن للآخرين رؤيتك الآن",
          });
        } catch (error) {
          toast({
            title: "خطأ في الفيديو",
            description: "تعذر الوصول للكاميرا",
            variant: "destructive"
          });
        }
      }
    } else if (!isVideoOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: isMicOn 
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        toast({
          title: "تم تشغيل الكاميرا",
          description: "يمكن للآخرين رؤيتك الآن",
        });
      } catch (error) {
        toast({
          title: "خطأ في الفيديو",
          description: "تعذر الوصول للكاميرا",
          variant: "destructive"
        });
      }
    }
  };
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Request screen sharing
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          
          // For demo purposes, we'll just toggle the state
          // In a real app, you'd handle the stream
          setIsScreenSharing(true);
          
          // Listen for when user stops sharing
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            setIsScreenSharing(false);
          });
        } else {
          // Fallback for browsers that don't support getDisplayMedia
          setIsScreenSharing(true);
          toast({
            title: "مشاركة الشاشة",
            description: "تم تشغيل مشاركة الشاشة (وضع التجريب)",
          });
        }
      } else {
        setIsScreenSharing(false);
        toast({
          title: "تم إيقاف المشاركة",
          description: "تم إيقاف مشاركة الشاشة",
        });
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast({
        title: "خطأ في مشاركة الشاشة",
        description: "لم نتمكن من بدء مشاركة الشاشة. تأكد من إعطاء الإذن.",
        variant: "destructive"
      });
    }
  };
  const toggleParticipants = () => setShowParticipants(!showParticipants);
  const toggleChat = () => setShowChat(!showChat);
  const toggleControlsPanel = () => setShowControls(!showControls);
  const toggleVirtualControlPanel = () => setShowVirtualControlPanel(!showVirtualControlPanel);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await meetingContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const shareInviteLink = async () => {
    const shareUrl = `${window.location.origin}/join/${meeting.id}`;
    
    console.log("Sharing meeting URL:", shareUrl);
    
    // Always try clipboard first for better compatibility
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم النسخ",
        description: `تم نسخ رابط الدعوة للاجتماع`,
      });
      return;
    } catch (err) {
      console.log("Clipboard failed, trying native share or showing dialog");
    }
    
    // Try native share API if clipboard fails (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `اجتماع: ${meeting.name}`,
          text: `انضم إلى الاجتماع: ${meeting.name}`,
          url: shareUrl,
        });
        toast({
          title: "تم المشاركة",
          description: "تم مشاركة رابط الاجتماع بنجاح",
        });
        return;
      } catch (err) {
        console.log("Native share failed, showing dialog");
      }
    }
    
    // Final fallback: show dialog
    setShowShareDialog(true);
  };

  // Virtual participants control functions
  const handleToggleVirtualParticipant = async (participantId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isActive ? 'active' : 'away' })
      });
      
      if (response.ok) {
        toast({
          title: "تم تحديث المشارك",
          description: `تم ${isActive ? 'تفعيل' : 'إيقاف'} المشارك بنجاح`,
        });
      }
    } catch (error) {
      console.error('Error toggling participant:', error);
    }
  };

  const handleUpdateVirtualSettings = (settings: VirtualParticipantSettings) => {
    setVirtualSettings(settings);
    if (behaviorSimulator && settings.realisticBehavior) {
      console.log('Updating virtual participant settings:', settings);
    }
  };

  const handleGenerateVirtualMessage = (participantId: string) => {
    if (messageGenerator) {
      const participant = participants.find(p => p.id === participantId);
      if (participant) {
        const personalityMessages = {
          professional: ['أقترح مراجعة هذه النقطة بتفصيل أكثر', 'من وجهة نظر مهنية، هذا الاقتراح ممتاز'],
          creative: ['لدي فكرة إبداعية حول هذا الموضوع! 🎨', 'ما رأيكم لو أضفنا لمسة مبتكرة؟'],
          technical: ['تقنياً، يمكننا تحسين هذا الحل', 'نحتاج لمراجعة الأداء والـ scalability'],
          manager: ['دعونا نحدد الأولويات والجدول الزمني', 'ما هي المخاطر المحتملة؟'],
          friendly: ['أحب هذا التوجه! 😊', 'شكراً لكم على هذا الطرح المفيد']
        };
        
        const messages = personalityMessages[participant.personality as keyof typeof personalityMessages] || personalityMessages.friendly;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        sendMessage(randomMessage, participant.name, participant.avatar);
        
        toast({
          title: "تم إرسال رسالة",
          description: `أرسل ${participant.name} رسالة جديدة`,
        });
      }
    }
  };

  const handleResetVirtualBehavior = () => {
    if (behaviorSimulator) {
      behaviorSimulator.destroy();
      
      const newSimulator = new RealisticBehaviorSimulator(participants);
      setBehaviorSimulator(newSimulator);
      
      toast({
        title: "تم إعادة تعيين السلوك",
        description: "تم إعادة تعيين سلوك المشاركين الافتراضيين",
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={meetingContainerRef}
      className={`h-screen flex flex-col bg-gray-900 ${isFullscreen ? 'p-0' : ''}`} 
      dir="rtl"
    >
      
      {/* Mobile Header - Enhanced Creative Design */}
      <header className="md:hidden bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-800/30 px-4 py-3 flex justify-between items-center relative z-50 backdrop-blur-lg">
        {/* Background Pattern - Mobile */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
          <div className="absolute top-0 left-1/3 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-0 right-1/3 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-75"></div>
        </div>
        
        <div className="flex items-center relative">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
            <div className="relative w-8 h-8 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
              <i className="fas fa-video text-white text-sm relative z-10"></i>
            </div>
          </div>
          <div className="mr-2 text-white">
            <h1 className="text-sm font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Meet powered by ma3k
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-2 relative">
          <Button 
            onClick={toggleChat}
            className={`relative group w-10 h-10 rounded-full transition-all duration-300 control-button ${
              showChat 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30' 
                : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 hover:text-white backdrop-blur-sm border border-gray-600/30'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-full transition-all duration-300"></div>
            <i className="fas fa-comments text-sm relative z-10"></i>
          </Button>
          
          <Button 
            onClick={shareInviteLink}
            className="relative group w-10 h-10 rounded-full bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 text-white control-button transition-all duration-300 shadow-lg shadow-blue-600/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 rounded-full transition-all duration-300"></div>
            <i className="fas fa-share text-sm relative z-10"></i>
          </Button>
          
          <Button 
            onClick={toggleControlsPanel}
            className={`relative group w-10 h-10 rounded-full transition-all duration-300 control-button ${
              showControls 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30' 
                : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 hover:text-white backdrop-blur-sm border border-gray-600/30'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-full transition-all duration-300"></div>
            <i className="fas fa-sliders-h text-sm relative z-10"></i>
          </Button>
        </div>
      </header>

      {/* Desktop Header - Enhanced Creative Design */}
      <header className="hidden md:flex bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-800/30 px-6 py-4 justify-between items-center relative z-10 backdrop-blur-lg">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-75"></div>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-4 relative">
          <div className="flex items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xl">
                <span className="relative z-10">مع</span>
              </div>
            </div>
            <div className="mr-4 text-white">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Meet powered by ma3k
              </h1>
              <p className="text-sm text-gray-300 opacity-80">منصة الاجتماعات الذكية</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-4 relative">
          <div className="flex items-center bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full ml-2 animate-pulse shadow-lg shadow-emerald-400/50"></div>
            <span className="font-medium">{isConnected ? 'متصل بنجاح' : 'غير متصل'}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={shareInviteLink}
            className="relative group bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 rounded-md transition-all duration-300"></div>
            <i className="fas fa-share ml-2 relative z-10"></i>
            <span className="relative z-10">مشاركة</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleFullscreen}
            className="relative group bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-md transition-all duration-300"></div>
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} ml-2 relative z-10`}></i>
            <span className="relative z-10">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLeave}
            className="relative group bg-gradient-to-r from-red-600/20 to-pink-600/20 text-white hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 hover:border-red-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-pink-600/0 group-hover:from-red-600/10 group-hover:to-pink-600/10 rounded-md transition-all duration-300"></div>
            <i className="fas fa-sign-out-alt ml-2 relative z-10"></i>
            <span className="relative z-10">مغادرة</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar - Show only when requested */}
        {showParticipants && (
          <div className="hidden md:block">
            <ParticipantManagement 
              meeting={meeting} 
              showParticipants={showParticipants}
            />
          </div>
        )}
        
        {/* Enhanced Main Meeting Area */}
        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-75"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-150"></div>
          </div>
          
          {/* Enhanced Meeting Header */}
          <div className="bg-gradient-to-r from-slate-800/90 via-purple-800/60 to-slate-800/90 backdrop-blur-lg border-b border-purple-700/30 px-6 py-4 flex justify-between items-center relative z-10">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse ml-2 shadow-lg shadow-red-500/50"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-white font-medium bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">جاري البث المباشر</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-lg">
                <span className="text-purple-200 text-sm font-medium">{meeting.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 text-white text-sm px-4 py-2 rounded-full">
                <i className="fas fa-users ml-2 text-purple-300"></i>
                <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent font-medium">4 مشاركين نشطين</span>
              </div>
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 text-white text-sm px-4 py-2 rounded-full">
                <i className="fas fa-clock ml-2 text-blue-300"></i>
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent font-medium">{formatDuration(meetingDuration)}</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Video Grid Area - Responsive */}
          <div className="flex-1 p-2 sm:p-6 video-grid meeting-active relative">
            
            {/* Enhanced Main Speaker (User) */}
            <div className="bg-gradient-to-br from-slate-800/80 via-purple-900/40 to-slate-800/80 rounded-xl relative backdrop-blur-lg border border-purple-700/30 p-4 col-span-full h-40 sm:h-56 lg:h-64 mb-3 sm:mb-4 shadow-2xl shadow-purple-900/20 overflow-hidden">
              {/* Speaker Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20"></div>
                <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-75"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {(() => {
                    const userName = localStorage.getItem('userName') || 'أنت';
                    const userAvatar = userName.slice(0, 2);
                    return (
                      <>
                        <div className="relative group">
                          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-full mx-auto flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold mb-3 participant-avatar shadow-2xl">
                            {userAvatar}
                          </div>
                        </div>
                        <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">{userName} (أنت)</h3>
                        <p className="text-purple-200 text-xs sm:text-sm font-medium">
                          <i className={`fas ${isMicOn ? 'fa-microphone text-green-400' : 'fa-microphone-slash text-red-400'} ml-1`}></i>
                          {isMicOn ? 'يتحدث الآن' : 'صامت'}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex space-x-reverse space-x-2">
                <div className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                  isMicOn 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400/50 shadow-lg shadow-green-500/30' 
                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-400/50 shadow-lg shadow-red-500/30'
                }`}>
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xs sm:text-sm`}></i>
                </div>
                {isVideoOn && (
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm border border-blue-400/50 shadow-lg shadow-blue-500/30">
                    <i className="fas fa-video text-xs sm:text-sm"></i>
                  </div>
                )}
              </div>
              <div className="absolute top-3 left-3 bg-gradient-to-r from-black/50 to-purple-900/50 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm backdrop-blur-sm border border-white/20">
                <i className="fas fa-user ml-1 text-purple-300"></i>
                {localStorage.getItem('userName') || 'أنت'}
              </div>
              {isScreenSharing && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm backdrop-blur-sm border border-blue-400/50 shadow-lg shadow-blue-500/30">
                  <i className="fas fa-desktop ml-1"></i>
                  مشاركة الشاشة
                </div>
              )}
            </div>
            
            {/* Enhanced Virtual Participants - More Realistic and Creative */}
            {(() => {
              const { data: participants = [] } = useQuery<VirtualParticipant[]>({
                queryKey: ['/api/meetings', meeting.id, 'participants'],
              });

              return participants.slice(0, 4).map((participant, index) => {
                // More diverse and vibrant color schemes based on personality
                const personalityColors = {
                  professional: 'from-slate-600 via-blue-600 to-slate-700',
                  creative: 'from-pink-500 via-purple-500 to-violet-600',
                  technical: 'from-cyan-500 via-blue-500 to-indigo-600',
                  manager: 'from-amber-500 via-orange-500 to-red-600',
                  friendly: 'from-green-500 via-emerald-500 to-teal-600'
                };
                
                const bgColor = personalityColors[participant.personality as keyof typeof personalityColors] || 'from-gray-500 via-slate-500 to-gray-600';
                
                // Get realistic behavior from simulator
                const behavior = behaviorSimulator?.getBehavior(participant.id);
                const isCurrentlySpeaking = behavior?.isCurrentlySpeaking || false;
                const hasRecentActivity = behavior?.hasRecentActivity || false;
                const activityDescription = behavior?.activityDescription || '';
                const connectionQuality = behavior?.connectionQuality || 'good';
                const isCameraOn = behavior?.isCameraOn || true;
                const isMuted = behavior?.isMuted || false;
                
                return (
                  <div 
                    key={participant.id} 
                    className={`bg-gradient-to-br from-slate-800/90 via-purple-900/50 to-slate-800/90 rounded-2xl relative p-4 participant-card backdrop-blur-lg border border-purple-700/40 shadow-2xl shadow-purple-900/30 hover:shadow-purple-800/40 transition-all duration-500 cursor-pointer overflow-hidden group ${
                      isCurrentlySpeaking ? 'ring-2 ring-green-400/60 ring-offset-2 ring-offset-transparent animate-pulse' : ''
                    }`}
                    onClick={() => {
                      // Simulate focusing on participant
                      console.log(`Focusing on ${participant.name}`);
                    }}
                  >
                    {/* Enhanced Background Pattern with Personality */}
                    <div className="absolute inset-0 opacity-30">
                      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor}/25`}></div>
                      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-purple-500/15 rounded-full blur-2xl animate-pulse"></div>
                      <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl animate-pulse delay-100"></div>
                      <div className="absolute top-3/4 right-1/3 w-20 h-20 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-200"></div>
                    </div>
                    
                    {/* Speaking Indicator Animation */}
                    {isCurrentlySpeaking && (
                      <div className="absolute inset-0 rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/20 to-green-400/10 rounded-2xl animate-pulse"></div>
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center relative">
                      <div className="text-center">
                        <div className="relative group">
                          {/* Enhanced Avatar with Personality-based Effects */}
                          <div className={`absolute -inset-2 bg-gradient-to-r ${bgColor} rounded-full blur opacity-60 group-hover:opacity-90 transition duration-500 ${hasRecentActivity ? 'animate-pulse' : ''}`}></div>
                          <div className={`relative w-20 h-20 bg-gradient-to-br ${bgColor} rounded-full mx-auto flex items-center justify-center text-white font-bold mb-3 shadow-2xl text-2xl transform transition-all duration-300 group-hover:scale-110 ${isCurrentlySpeaking ? 'scale-105' : ''}`}>
                            {participant.avatar}
                          </div>
                          
                          {/* Personality Badge */}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center text-xs border-2 border-white shadow-lg">
                            {participant.personality === 'professional' && '💼'}
                            {participant.personality === 'creative' && '🎨'}
                            {participant.personality === 'technical' && '⚡'}
                            {participant.personality === 'manager' && '👑'}
                            {participant.personality === 'friendly' && '😊'}
                          </div>
                        </div>
                        
                        <h4 className="text-white font-bold text-sm bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-1">{participant.name}</h4>
                        
                        {/* Enhanced Status with More Information */}
                        <div className="flex flex-col items-center space-y-1">
                          <span className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                            participant.status === 'active' 
                              ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-200 border-emerald-500/50 shadow-sm shadow-emerald-500/20' :
                            participant.status === 'away' 
                              ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200 border-yellow-500/50 shadow-sm shadow-yellow-500/20' :
                              'bg-gradient-to-r from-gray-600/30 to-gray-500/30 text-gray-200 border-gray-500/50'
                          }`}>
                            <i className={`fas ${
                              participant.status === 'active' ? 'fa-circle text-green-400' :
                              participant.status === 'away' ? 'fa-clock text-yellow-400' :
                              'fa-circle-dot text-gray-400'
                            } ml-1 text-xs ${isCurrentlySpeaking ? 'animate-pulse' : ''}`}></i>
                            {participant.status === 'active' ? (isCurrentlySpeaking ? 'يتحدث' : 'نشط') :
                             participant.status === 'away' ? 'بعيد' : 'غير متصل'}
                          </span>
                          
                          {/* Realistic Activity Indicator */}
                          {hasRecentActivity && (
                            <span className="text-xs text-purple-300 opacity-75">
                              {activityDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Header with Professional Look */}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-black/60 to-purple-900/60 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm border border-white/30 shadow-lg">
                      <div className="flex items-center">
                        <i className="fas fa-user ml-1 text-purple-300"></i>
                        <span className="font-medium">{participant.name}</span>
                      </div>
                    </div>
                    
                    {/* Enhanced Microphone Status with Realistic Behavior */}
                    <div className={`absolute bottom-3 left-3 p-2.5 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-lg ${
                      !isMuted && participant.status === 'active' 
                        ? `bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400/60 shadow-green-500/40 ${isCurrentlySpeaking ? 'animate-pulse scale-110' : ''}` 
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-400/60 shadow-red-500/40'
                    }`}>
                      <i className={`fas ${!isMuted && participant.status === 'active' ? 'fa-microphone' : 'fa-microphone-slash'} text-sm`}></i>
                    </div>
                    
                    {/* Video Status Indicator with Realistic Behavior */}
                    {isCameraOn ? (
                      <div className="absolute bottom-3 right-3 p-2 rounded-full bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white backdrop-blur-sm border border-blue-400/60 shadow-lg shadow-blue-500/30">
                        <i className="fas fa-video text-xs"></i>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 right-3 p-2 rounded-full bg-gradient-to-r from-gray-500/80 to-gray-600/80 text-white backdrop-blur-sm border border-gray-400/60 shadow-lg shadow-gray-500/30">
                        <i className="fas fa-video-slash text-xs"></i>
                      </div>
                    )}
                    
                    {/* Realistic Connection Quality Indicator */}
                    <div className="absolute top-3 right-3 flex space-x-1">
                      <div className={`w-1 h-3 rounded-full transition-all duration-300 ${
                        connectionQuality === 'excellent' ? 'bg-green-400' :
                        connectionQuality === 'good' ? 'bg-green-400' :
                        connectionQuality === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <div className={`w-1 h-4 rounded-full transition-all duration-300 ${
                        connectionQuality === 'excellent' ? 'bg-green-400' :
                        connectionQuality === 'good' ? 'bg-green-400' :
                        connectionQuality === 'fair' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                      <div className={`w-1 h-5 rounded-full transition-all duration-300 ${
                        connectionQuality === 'excellent' ? 'bg-green-400' :
                        connectionQuality === 'good' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                );
              });
            })()}
            
          </div>
          
          {/* Enhanced Meeting Controls - Mobile Responsive */}
          <div className="bg-gradient-to-r from-slate-800/90 via-purple-800/60 to-slate-800/90 backdrop-blur-lg border-t border-purple-700/30 px-3 sm:px-6 py-4 sm:py-6 relative overflow-hidden">
            {/* Controls Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
            </div>
            
            {/* Enhanced Desktop Layout */}
            <div className="hidden sm:flex items-center justify-center space-x-reverse space-x-6 relative">
              
              {/* Enhanced Primary Controls */}
              <div className="flex items-center space-x-reverse space-x-3 bg-gradient-to-r from-white/10 to-purple-900/20 backdrop-blur-lg rounded-full px-6 py-3 border border-purple-700/30 shadow-xl shadow-purple-900/20">
                <div className="relative group">
                  <Button
                    onClick={toggleMicrophone}
                    className={`w-14 h-14 rounded-full control-button transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border ${
                      isMicOn 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-xl shadow-green-500/40 border-green-400/50' 
                        : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-xl shadow-red-500/40 border-red-400/50'
                    }`}
                  >
                    <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`}></i>
                  </Button>
                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full control-button transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border ${
                      isVideoOn
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/40 border-blue-400/50'
                        : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white shadow-lg shadow-gray-600/30 border-gray-500/50'
                    }`}
                  >
                    <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-lg`}></i>
                  </Button>
                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleScreenShare}
                    className={`w-14 h-14 rounded-full control-button transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border ${
                      isScreenSharing
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/40 border-purple-400/50'
                        : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white shadow-lg shadow-gray-600/30 border-gray-500/50'
                    }`}
                  >
                    <i className={`fas fa-desktop text-lg`}></i>
                  </Button>
                </div>
              </div>

              {/* Enhanced Secondary Controls */}
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="relative group">
                  <Button
                    onClick={toggleParticipants}
                    className="w-12 h-12 bg-gradient-to-r from-slate-600/80 to-purple-600/60 hover:from-slate-500/80 hover:to-purple-500/60 text-white rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-purple-600/30 shadow-lg shadow-purple-600/20"
                  >
                    <i className="fas fa-users text-sm"></i>
                  </Button>
                </div>

                <div className="relative group">
                  <Button
                    onClick={() => setShowChat(!showChat)}
                    className={`w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border shadow-lg ${
                      showChat 
                        ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/60 hover:from-green-500/80 hover:to-emerald-500/60 text-white border-green-600/30 shadow-green-600/20' 
                        : 'bg-gradient-to-r from-slate-600/80 to-purple-600/60 hover:from-slate-500/80 hover:to-purple-500/60 text-white border-purple-600/30 shadow-purple-600/20'
                    }`}
                  >
                    <i className="fas fa-comments text-sm"></i>
                  </Button>
                </div>

                <div className="relative group">
                  <Button
                    onClick={shareInviteLink}
                    className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-purple-600/60 hover:from-blue-500/80 hover:to-purple-500/60 text-white rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-blue-600/30 shadow-lg shadow-blue-600/20"
                  >
                    <i className="fas fa-share text-sm"></i>
                  </Button>
                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleVirtualControlPanel}
                    className={`w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border shadow-lg ${
                      showVirtualControlPanel 
                        ? 'bg-gradient-to-r from-pink-600/80 to-purple-600/60 hover:from-pink-500/80 hover:to-purple-500/60 text-white border-pink-600/30 shadow-pink-600/20' 
                        : 'bg-gradient-to-r from-slate-600/80 to-purple-600/60 hover:from-slate-500/80 hover:to-purple-500/60 text-white border-purple-600/30 shadow-purple-600/20'
                    }`}
                  >
                    <i className="fas fa-robot text-sm"></i>
                  </Button>
                </div>

                <div className="relative group">
                  <Button
                    onClick={toggleFullscreen}
                    className="w-12 h-12 bg-gradient-to-r from-purple-600/80 to-pink-600/60 hover:from-purple-500/80 hover:to-pink-500/60 text-white rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-purple-600/30 shadow-lg shadow-purple-600/20"
                  >
                    <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                  </Button>
                </div>
              </div>

              {/* Enhanced Leave Button */}
              <div className="relative group">
                <Button
                  onClick={onLeave}
                  className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-red-400/50 shadow-xl shadow-red-500/40"
                >
                  <i className="fas fa-phone-slash text-lg"></i>
                </Button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              {/* Primary Row - Most Important Controls */}
              <div className="flex items-center justify-center space-x-reverse space-x-4 mb-4">
                <Button
                  onClick={toggleMicrophone}
                  className={`w-16 h-16 rounded-full control-button transition-all duration-300 transform active:scale-95 ${
                    isMicOn 
                      ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl' 
                      : 'bg-red-500 hover:bg-red-600 text-white status-busy shadow-xl'
                  }`}
                >
                  <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xl`}></i>
                </Button>

                <Button
                  onClick={toggleVideo}
                  className={`w-16 h-16 rounded-full control-button transition-all duration-300 transform active:scale-95 ${
                    isVideoOn
                      ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl'
                      : 'bg-gray-600 hover:bg-gray-500 text-white shadow-xl'
                  }`}
                >
                  <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-xl`}></i>
                </Button>

                <Button
                  onClick={onLeave}
                  className="w-16 h-16 bg-danger hover:bg-danger/90 text-white rounded-full control-button transition-all duration-300 transform active:scale-95 status-busy shadow-xl"
                >
                  <i className="fas fa-phone-slash text-xl"></i>
                </Button>
              </div>

              {/* Secondary Row - Additional Controls */}
              <div className="flex items-center justify-center space-x-reverse space-x-2">
                <Button
                  onClick={toggleScreenShare}
                  className={`w-12 h-12 rounded-full control-button transition-all duration-300 ${
                    isScreenSharing
                      ? 'bg-primary hover:bg-primary/90 text-white status-online'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  <i className="fas fa-desktop text-sm"></i>
                </Button>

                <Button
                  onClick={toggleParticipants}
                  className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full control-button transition-all duration-300"
                >
                  <i className="fas fa-users text-sm"></i>
                </Button>

                <Button
                  onClick={() => setShowChat(!showChat)}
                  className={`w-12 h-12 rounded-full control-button transition-all duration-300 ${
                    showChat 
                      ? 'bg-green-600 hover:bg-green-500 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <i className="fas fa-comments text-sm"></i>
                </Button>

                <Button
                  onClick={shareInviteLink}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
                >
                  <i className="fas fa-share text-sm"></i>
                </Button>

                <QuickReactions 
                  onReaction={(emoji) => {
                    sendMessage(`تفاعل ${emoji}`, localStorage.getItem('userName') || 'مستخدم');
                  }}
                />

                <Button
                  onClick={toggleFullscreen}
                  className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
                >
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
                </Button>
              </div>

              {/* Mobile Status Indicators */}
              <div className="flex items-center justify-center mt-4 space-x-reverse space-x-3 text-xs">
                <div className={`flex items-center px-2 py-1 rounded-full glass-effect ${isMicOn ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ml-1 status-${isMicOn ? 'online' : 'busy'}`}></div>
                  <span>{isMicOn ? 'مفتوح' : 'مكتوم'}</span>
                </div>
                {isVideoOn && (
                  <div className="flex items-center px-2 py-1 rounded-full glass-effect text-green-400">
                    <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                    <span>فيديو</span>
                  </div>
                )}
                {isScreenSharing && (
                  <div className="flex items-center px-2 py-1 rounded-full glass-effect text-blue-400">
                    <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                    <span>مشاركة</span>
                  </div>
                )}
                <div className="flex items-center px-2 py-1 rounded-full glass-effect text-gray-300">
                  <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                  <span>{formatDuration(meetingDuration)}</span>
                </div>
              </div>
            </div>

            {/* Desktop Status Bar */}
            <div className="hidden sm:flex items-center justify-center mt-4 space-x-reverse space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ml-2 ${isMicOn ? 'bg-success' : 'bg-red-500'}`}></div>
                <span>{isMicOn ? 'الميكروفون مفتوح' : 'الميكروفون مكتوم'}</span>
              </div>
              {isVideoOn && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full ml-2"></div>
                  <span>الفيديو مفتوح</span>
                </div>
              )}
              {isScreenSharing && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                  <span>مشاركة الشاشة نشطة</span>
                </div>
              )}
            </div>
          </div>
          
        </main>
        
        {/* Desktop Chat Sidebar - Show only when requested */}
        {showChat && (
          <div className="hidden md:block">
            <ChatSidebar 
              meeting={meeting}
              messages={messages}
              onSendMessage={sendMessage}
              setMessages={setMessages}
            />
          </div>
        )}

        {/* Desktop Participants Sidebar */}
        {showParticipants && (
          <div className="hidden md:block w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <MeetingCodeDisplay 
                meetingId={meeting.id}
                meetingName={meeting.name}
              />
            </div>
            <ParticipantManagement 
              meeting={meeting}
              realUsers={realUsers}
            />
          </div>
        )}

        {/* Virtual Participants Control Panel Sidebar */}
        {showVirtualControlPanel && (
          <div className="hidden md:block w-80 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-l border-purple-700/40 overflow-y-auto">
            <div className="p-4">
              <VirtualParticipantsControlPanel
                participants={participants}
                onToggleParticipant={handleToggleVirtualParticipant}
                onUpdateSettings={handleUpdateVirtualSettings}
                onGenerateMessage={handleGenerateVirtualMessage}
                onResetBehavior={handleResetVirtualBehavior}
              />
            </div>
          </div>
        )}

        {/* Mobile Virtual Participants Control Panel Overlay */}
        <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 backdrop-blur-sm ${
          showVirtualControlPanel ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} onClick={toggleVirtualControlPanel}>
          <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ${
            showVirtualControlPanel ? 'translate-x-0' : 'translate-x-full'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-purple-200/30 bg-gradient-to-r from-purple-800/80 via-pink-800/50 to-purple-800/80 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg">
                  <i className="fas fa-robot text-sm"></i>
                </div>
                <h3 className="font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">المشاركون الافتراضيون</h3>
              </div>
              <Button 
                onClick={toggleVirtualControlPanel}
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0 text-purple-300 hover:text-red-300 bg-gradient-to-r from-white/10 to-purple-100/20 hover:from-red-100/20 hover:to-red-200/20 rounded-full backdrop-blur-sm border border-purple-200/40 hover:border-red-300/40 transition-all duration-300"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <div className="h-full overflow-y-auto p-4">
              <VirtualParticipantsControlPanel
                participants={participants}
                onToggleParticipant={handleToggleVirtualParticipant}
                onUpdateSettings={handleUpdateVirtualSettings}
                onGenerateMessage={handleGenerateVirtualMessage}
                onResetBehavior={handleResetVirtualBehavior}
              />
            </div>
          </div>
        </div>
        
        {/* Mobile Chat Overlay */}
        <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          showChat ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} onClick={toggleChat}>
          <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white transform transition-transform duration-300 ${
            showChat ? 'translate-x-0' : 'translate-x-full'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">المحادثة</h3>
              <Button 
                onClick={toggleChat}
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <div className="h-full">
              <ChatSidebar 
                meeting={meeting}
                messages={messages}
                onSendMessage={sendMessage}
                setMessages={setMessages}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Participants Overlay */}
        <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 backdrop-blur-sm ${
          showParticipants ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} onClick={toggleParticipants}>
          <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 backdrop-blur-lg shadow-2xl transform transition-transform duration-300 ${
            showParticipants ? 'translate-x-0' : '-translate-x-full'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-purple-200/30 bg-gradient-to-r from-white/80 via-purple-50/50 to-pink-50/30 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg">
                  <i className="fas fa-users text-sm"></i>
                </div>
                <h3 className="font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">إدارة المشاركين</h3>
              </div>
              <Button 
                onClick={toggleParticipants}
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0 text-purple-600 hover:text-red-500 bg-gradient-to-r from-white/80 to-purple-100/60 hover:from-red-100/80 hover:to-red-200/60 rounded-full backdrop-blur-sm border border-purple-200/40 hover:border-red-300/40 transition-all duration-300"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              <ParticipantManagement 
                meeting={meeting}
                realUsers={realUsers}
              />
            </div>
          </div>
        </div>
        
        {/* Mobile Controls Overlay */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 glass-effect">
            {/* Close button */}
            <div className="flex justify-center mb-4">
              <Button 
                onClick={toggleControlsPanel}
                className="w-10 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-full"
              >
                <i className="fas fa-chevron-down text-sm"></i>
              </Button>
            </div>
            
            {/* Primary Controls */}
            <div className="flex items-center justify-center space-x-reverse space-x-4 mb-4">
              <Button
                onClick={toggleMicrophone}
                className={`w-16 h-16 rounded-full control-button transition-all duration-300 ${
                  isMicOn 
                    ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl' 
                    : 'bg-red-500 hover:bg-red-600 text-white status-busy shadow-xl'
                }`}
              >
                <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xl`}></i>
              </Button>

              <Button
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full control-button transition-all duration-300 ${
                  isVideoOn
                    ? 'bg-success hover:bg-success/90 text-white status-online shadow-xl'
                    : 'bg-gray-600 hover:bg-gray-500 text-white shadow-xl'
                }`}
              >
                <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-xl`}></i>
              </Button>

              <Button
                onClick={onLeave}
                className="w-16 h-16 bg-danger hover:bg-danger/90 text-white rounded-full control-button transition-all duration-300 status-busy shadow-xl"
              >
                <i className="fas fa-phone-slash text-xl"></i>
              </Button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center space-x-reverse space-x-3 mb-4">
              <Button
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full control-button transition-all duration-300 ${
                  isScreenSharing
                    ? 'bg-primary hover:bg-primary/90 text-white status-online'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                <i className="fas fa-desktop text-sm"></i>
              </Button>

              <Button
                onClick={shareInviteLink}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
              >
                <i className="fas fa-share text-sm"></i>
              </Button>

              <Button
                onClick={toggleFullscreen}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full control-button transition-all duration-300 glass-effect"
              >
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
              </Button>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center justify-center space-x-reverse space-x-3 text-xs">
              <div className={`flex items-center px-2 py-1 rounded-full glass-effect ${isMicOn ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ml-1 status-${isMicOn ? 'online' : 'busy'}`}></div>
                <span>{isMicOn ? 'مفتوح' : 'مكتوم'}</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded-full glass-effect text-gray-300">
                <div className="w-2 h-2 status-online rounded-full ml-1"></div>
                <span>{formatDuration(meetingDuration)}</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Share Dialog Modal */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">مشاركة رابط الاجتماع</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط الاجتماع:
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${window.location.origin}/meeting/${meeting.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => {
                      const url = `${window.location.origin}/meeting/${meeting.id}`;
                      navigator.clipboard.writeText(url).then(() => {
                        toast({
                          title: "تم النسخ",
                          description: "تم نسخ رابط الاجتماع بنجاح",
                        });
                        setShowShareDialog(false);
                      });
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-l-md hover:bg-primary/90"
                  >
                    نسخ
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                شارك هذا الرابط مع الأشخاص الذين تريد دعوتهم للاجتماع
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowShareDialog(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
