import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, RealUser } from '@shared/schema';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(meetingId: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [realUsers, setRealUsers] = useState<RealUser[]>([]);

  useEffect(() => {
    if (!meetingId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      
      // First join the meeting
      ws.current?.send(JSON.stringify({
        type: 'join_meeting',
        meetingId
      }));
      
      // Then announce user joined if we have user info
      const userName = localStorage.getItem('userName');
      if (userName) {
        ws.current?.send(JSON.stringify({
          type: 'user_joined',
          meetingId,
          userName,
          userAvatar: userName.slice(0, 2),
          isHost: false
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
        }
        
        if (data.type === 'user_joined') {
          setRealUsers(prev => {
            const existing = prev.find(u => u.id === data.user.id);
            if (existing) return prev;
            return [...prev, data.user];
          });
        }
        
        if (data.type === 'user_left') {
          setRealUsers(prev => prev.filter(u => u.id !== data.userId));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [meetingId]);

  const sendMessage = (message: string, senderName?: string, senderAvatar?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN && meetingId) {
      // Get user name from localStorage if not provided
      const userName = senderName || localStorage.getItem('userName') || 'أنت';
      const userAvatar = senderAvatar || userName.slice(0, 2);
      
      ws.current.send(JSON.stringify({
        type: 'send_message',
        meetingId,
        message,
        senderName: userName,
        senderAvatar: userAvatar,
        isFromRealUser: true
      }));
    }
  };

  return {
    isConnected,
    messages,
    realUsers,
    sendMessage,
    setMessages,
    setRealUsers
  };
}
