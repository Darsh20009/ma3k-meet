import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { arabicParticipantTemplates, generateRandomMessage, getMessageDelay } from "@/lib/virtual-participants";
import type { Meeting, ChatMessage, VirtualParticipant } from "@shared/schema";

interface ChatSidebarProps {
  meeting: Meeting;
  messages: ChatMessage[];
  onSendMessage: (message: string, senderName?: string, senderAvatar?: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatSidebar({ meeting, messages, onSendMessage, setMessages }: ChatSidebarProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [typingParticipant, setTypingParticipant] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const autoMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: participants = [] } = useQuery<VirtualParticipant[]>({
    queryKey: ['/api/meetings', meeting.id, 'participants'],
  });

  const { data: initialMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/meetings', meeting.id, 'messages'],
  });

  // Combine initial messages with real-time messages
  const allMessages = [...initialMessages, ...messages];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [allMessages]);

  // Auto-message system
  useEffect(() => {
    if (!isAutoEnabled || participants.length === 0) return;

    const scheduleNextMessage = () => {
      const delay = getMessageDelay(meeting.settings?.messageSpeed || 'medium');
      
      autoMessageTimeoutRef.current = setTimeout(() => {
        // Select random active participant
        const activeParticipants = participants.filter(p => p.status === 'active');
        if (activeParticipants.length === 0) {
          scheduleNextMessage();
          return;
        }

        const randomParticipant = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
        
        // Find matching template for message generation
        const template = arabicParticipantTemplates.find(t => t.name === randomParticipant.name) 
          || arabicParticipantTemplates[0];

        // Show typing indicator
        setTypingParticipant(randomParticipant.name);

        setTimeout(() => {
          setTypingParticipant(null);
          
          // Generate and send message
          const message = generateRandomMessage(template);
          const autoMessage: ChatMessage = {
            id: Date.now().toString(),
            meetingId: meeting.id,
            senderId: randomParticipant.id,
            senderName: randomParticipant.name,
            senderAvatar: randomParticipant.avatar,
            message,
            timestamp: new Date(),
            isSystemMessage: false
          };

          setMessages(prev => [...prev, autoMessage]);
          scheduleNextMessage();
        }, 1000 + Math.random() * 3000); // Random typing delay
      }, delay);
    };

    // Start the auto-message system
    const initialDelay = setTimeout(scheduleNextMessage, 5000);

    return () => {
      clearTimeout(initialDelay);
      if (autoMessageTimeoutRef.current) {
        clearTimeout(autoMessageTimeoutRef.current);
      }
    };
  }, [isAutoEnabled, participants, meeting, setMessages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleAutoChat = () => {
    setIsAutoEnabled(!isAutoEnabled);
    if (autoMessageTimeoutRef.current) {
      clearTimeout(autoMessageTimeoutRef.current);
    }
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
      
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">محادثة الاجتماع</h3>
        <div className="flex items-center space-x-reverse space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${
            isAutoEnabled ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
          }`}>
            {isAutoEnabled ? 'تلقائي' : 'معطل'}
          </span>
          <Button
            onClick={toggleAutoChat}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <i className={`fas ${isAutoEnabled ? 'fa-pause' : 'fa-play'} text-sm`}></i>
          </Button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        
        {/* System Message */}
        <div className="text-center">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            بدأ الاجتماع
          </span>
        </div>
        
        {/* Messages */}
        {allMessages.map((message) => (
          <div key={message.id} className="chat-message">
            {message.isSystemMessage ? (
              <div className="text-center">
                <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <i className="fas fa-info-circle ml-1"></i>
                  {message.message}
                </span>
              </div>
            ) : (
              <div className="flex items-start space-x-reverse space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {message.senderAvatar || message.senderName.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{message.senderName}</span>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-800">
                    {message.message}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingParticipant && (
          <div className="flex items-center space-x-reverse space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span>{typingParticipant} يكتب...</span>
          </div>
        )}
        
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex space-x-reverse space-x-2">
          <Input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-white px-4"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center space-x-reverse space-x-4 text-sm text-gray-500">
            <button className="hover:text-primary">
              <i className="fas fa-paperclip ml-1"></i>
              مرفق
            </button>
            <button className="hover:text-primary">
              <i className="fas fa-smile ml-1"></i>
              رموز
            </button>
          </div>
          <div className="text-xs text-gray-400">
            {isAutoEnabled ? 'يتم تشغيل الرسائل التلقائية' : 'الرسائل التلقائية معطلة'}
          </div>
        </div>
      </div>
      
    </aside>
  );
}
