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
            isSystemMessage: false,
            isFromRealUser: false
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

  const downloadConversation = () => {
    const conversationData = {
      meetingName: meeting.name,
      meetingType: meeting.type,
      exportDate: new Date().toLocaleString('ar-SA'),
      participants: participants.map(p => ({
        name: p.name,
        status: p.status
      })),
      messages: allMessages.map(msg => ({
        time: formatTime(msg.timestamp),
        sender: msg.senderName,
        message: msg.message,
        isSystem: msg.isSystemMessage
      }))
    };

    // Create formatted text content
    let textContent = `تقرير محادثة الاجتماع\n`;
    textContent += `===================\n\n`;
    textContent += `اسم الاجتماع: ${meeting.name}\n`;
    textContent += `نوع الاجتماع: ${meeting.type}\n`;
    textContent += `تاريخ التصدير: ${conversationData.exportDate}\n`;
    textContent += `عدد المشاركين: ${participants.length}\n\n`;
    
    textContent += `المشاركون:\n`;
    textContent += `----------\n`;
    participants.forEach(p => {
      textContent += `• ${p.name} (${p.status === 'active' ? 'نشط' : 'غير نشط'})\n`;
    });
    
    textContent += `\n\nسجل المحادثة:\n`;
    textContent += `=============\n\n`;
    
    allMessages.forEach(msg => {
      if (msg.isSystemMessage) {
        textContent += `[النظام] ${msg.message}\n\n`;
      } else {
        textContent += `[${formatTime(msg.timestamp)}] ${msg.senderName}:\n`;
        textContent += `${msg.message}\n\n`;
      }
    });

    // Create and download JSON file
    const jsonBlob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `محادثة_${meeting.name}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    // Create and download text file
    const textBlob = new Blob([textContent], {
      type: 'text/plain;charset=utf-8'
    });
    const textUrl = URL.createObjectURL(textBlob);
    const textLink = document.createElement('a');
    textLink.href = textUrl;
    textLink.download = `تقرير_محادثة_${meeting.name}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(textLink);
    textLink.click();
    document.body.removeChild(textLink);
    URL.revokeObjectURL(textUrl);
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
    <aside className="w-full sm:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      
      {/* Chat Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">محادثة الاجتماع</h3>
          <div className="flex items-center space-x-reverse space-x-1 sm:space-x-2">
            <Button
              onClick={downloadConversation}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 glass-effect hover:bg-blue-50"
              title="تحميل المحادثة"
            >
              <i className="fas fa-download text-xs sm:text-sm text-blue-600"></i>
            </Button>
            <span className={`text-xs px-2 py-1 rounded ${
              isAutoEnabled ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
            }`}>
              {isAutoEnabled ? 'تلقائي' : 'معطل'}
            </span>
            <Button
              onClick={toggleAutoChat}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 control-button"
            >
              <i className={`fas ${isAutoEnabled ? 'fa-pause' : 'fa-play'} text-xs sm:text-sm`}></i>
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {allMessages.length} رسالة • {participants.length} مشارك
        </div>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 chat-container"
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
              <div className="flex items-start space-x-reverse space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium participant-avatar">
                  {message.senderAvatar || message.senderName.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-reverse space-x-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 sm:p-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors chat-message">
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
      <div className="p-3 sm:p-4 border-t border-gray-100">
        <div className="flex space-x-reverse space-x-2">
          <Input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 chat-input text-sm sm:text-base"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 control-button min-h-[44px] sm:min-h-[40px]"
          >
            <i className="fas fa-paper-plane text-sm"></i>
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
