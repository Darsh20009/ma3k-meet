import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isUser: boolean;
}

interface EnhancedChatProps {
  meetingId: string;
  userName: string;
}

export default function EnhancedChat({ meetingId, userName }: EnhancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: userName,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate typing indicator for other users
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Add automated response
      const responses = [
        "أفكار رائعة! 👍",
        "أتفق معك تماماً",
        "هذا مقترح ممتاز",
        "شكراً لك على المشاركة",
        "نقطة مهمة جداً",
        "دعونا نناقش هذا أكثر",
        "ما رأيكم في هذا؟",
        "هل لديكم أي تساؤلات؟"
      ];
      
      const autoResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "مساعد ذكي",
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prev => [...prev, autoResponse]);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-96 bg-white/90 backdrop-blur-sm shadow-xl border-0">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-3">
            <i className="fas fa-comments text-lg"></i>
            <h3 className="font-semibold">شات الاجتماع</h3>
          </div>
          <div className="text-sm opacity-90">
            <i className="fas fa-users mr-2"></i>
            متصل: {userName}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <i className="fas fa-comment-dots text-3xl mb-3 text-gray-300"></i>
            <p>لا توجد رسائل بعد</p>
            <p className="text-sm">ابدأ المحادثة الآن!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.isUser
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              } shadow-md`}
            >
              {!message.isUser && (
                <div className="text-xs font-medium mb-1 text-gray-600">
                  {message.sender}
                </div>
              )}
              <p className="text-sm">{message.text}</p>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-2xl shadow-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">يكتب...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-reverse space-x-2">
          <Input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </div>
    </Card>
  );
}