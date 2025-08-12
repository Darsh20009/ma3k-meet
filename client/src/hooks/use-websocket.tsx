import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@shared/schema';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(meetingId: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!meetingId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      ws.current?.send(JSON.stringify({
        type: 'join_meeting',
        meetingId
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
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
        senderAvatar: userAvatar
      }));
    }
  };

  return {
    isConnected,
    messages,
    sendMessage,
    setMessages
  };
}
