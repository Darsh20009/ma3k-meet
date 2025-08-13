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
    <aside className="w-full sm:w-80 lg:w-96 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 border-l border-purple-200/40 flex flex-col h-full backdrop-blur-lg">
      
      {/* Enhanced Chat Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-200/30 bg-gradient-to-r from-white/80 via-purple-50/50 to-pink-50/30 backdrop-blur-sm relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          <div className="absolute top-0 left-1/4 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="flex justify-between items-center mb-2 relative">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg">
              <i className="fas fa-comments text-sm"></i>
            </div>
            <h3 className="font-bold text-sm sm:text-base bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">محادثة الاجتماع المباشرة</h3>
          </div>
          <div className="flex items-center space-x-reverse space-x-1 sm:space-x-2">
            <Button
              onClick={downloadConversation}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 glass-effect hover:bg-purple-50 border border-purple-200/30 transition-all duration-300"
              title="تحميل المحادثة"
            >
              <i className="fas fa-download text-xs sm:text-sm text-purple-600"></i>
            </Button>
            <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm border transition-all duration-300 ${
              isAutoEnabled 
                ? 'text-emerald-700 bg-emerald-100/80 border-emerald-300/40 shadow-sm' 
                : 'text-gray-600 bg-gray-100/80 border-gray-300/40'
            }`}>
              {isAutoEnabled ? 'تلقائي' : 'معطل'}
            </span>
            <Button
              onClick={toggleAutoChat}
              variant="ghost"
              size="sm"
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 control-button transition-all duration-300 border ${
                isAutoEnabled 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg shadow-purple-600/30' 
                  : 'border-gray-300/50 hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${isAutoEnabled ? 'fa-pause' : 'fa-play'} text-xs sm:text-sm`}></i>
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-600/80 bg-white/50 px-3 py-1 rounded-full inline-block backdrop-blur-sm border border-purple-200/30 relative">
          <i className="fas fa-message ml-1 text-purple-600"></i>
          {allMessages.length} رسالة • {participants.length} مشارك نشط
        </div>
      </div>
      
      {/* Enhanced Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 chat-container bg-gradient-to-b from-transparent via-white/30 to-transparent"
      >
        
        {/* Enhanced System Message */}
        <div className="text-center">
          <span className="text-xs text-purple-700 bg-gradient-to-r from-purple-100/80 to-pink-100/80 px-4 py-2 rounded-full backdrop-blur-sm border border-purple-200/40 shadow-sm">
            <i className="fas fa-play-circle ml-1"></i>
            بدأ الاجتماع المباشر
          </span>
        </div>
        
        {/* Messages */}
        {allMessages.map((message) => (
          <div key={message.id} className="chat-message">
            {message.isSystemMessage ? (
              <div className="text-center">
                <span className="text-xs text-blue-700 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 px-4 py-2 rounded-full backdrop-blur-sm border border-blue-200/40 shadow-sm">
                  <i className="fas fa-info-circle ml-1"></i>
                  {message.message}
                </span>
              </div>
            ) : (
              <div className="flex items-start space-x-reverse space-x-2 sm:space-x-3 hover:bg-white/50 rounded-xl p-2 -m-2 transition-all duration-300">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium participant-avatar shadow-lg">
                    {message.senderAvatar || message.senderName.slice(0, 2)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-reverse space-x-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-gray-800 to-purple-700 bg-clip-text text-transparent truncate">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="bg-gradient-to-br from-white/90 to-purple-50/60 rounded-lg p-2 sm:p-3 text-sm text-gray-800 hover:from-white hover:to-purple-50/80 transition-all duration-300 chat-message shadow-sm border border-purple-100/30 backdrop-blur-sm">
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
      
      {/* Enhanced Chat Input */}
      <div className="p-3 sm:p-4 border-t border-purple-200/30 bg-gradient-to-r from-white/80 via-purple-50/50 to-pink-50/30 backdrop-blur-sm relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        </div>
        
        <div className="flex space-x-reverse space-x-2 relative">
          <Input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 chat-input text-sm sm:text-base bg-white/90 border-purple-200/40 focus:border-purple-400/60 focus:ring-purple-400/30 backdrop-blur-sm shadow-sm"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`px-3 sm:px-4 control-button min-h-[44px] sm:min-h-[40px] transition-all duration-300 ${
              newMessage.trim() 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-3 relative">
          <div className="flex items-center space-x-reverse space-x-4 text-sm">
            <button className="text-purple-600 hover:text-purple-700 transition-colors duration-300 bg-white/50 px-2 py-1 rounded-lg hover:bg-white/80 backdrop-blur-sm border border-purple-200/30">
              <i className="fas fa-paperclip ml-1"></i>
              مرفق
            </button>
            <button className="text-purple-600 hover:text-purple-700 transition-colors duration-300 bg-white/50 px-2 py-1 rounded-lg hover:bg-white/80 backdrop-blur-sm border border-purple-200/30">
              <i className="fas fa-smile ml-1"></i>
              رموز
            </button>
          </div>
          <div className="text-xs bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm border border-purple-200/30">
            <i className={`fas ${isAutoEnabled ? 'fa-robot text-emerald-600' : 'fa-pause text-gray-600'} ml-1`}></i>
            <span className={isAutoEnabled ? 'text-emerald-700' : 'text-gray-600'}>
              {isAutoEnabled ? 'الرسائل التلقائية نشطة' : 'الرسائل التلقائية معطلة'}
            </span>
          </div>
        </div>
      </div>
      
    </aside>
  );
}
