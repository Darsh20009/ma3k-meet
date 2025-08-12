import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import AuthWrapper from "@/components/AuthWrapper";

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isUser: boolean;
  reactions?: string[];
}

interface ChatRoom {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  messages: ChatMessage[];
  participants: UserParticipant[];
}

interface UserParticipant {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  theme: string;
  chatBackground: string;
  createdAt: Date;
}

function PersonalChatContent() {
  const { chatId } = useParams<{ chatId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserParticipant[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());

  // Load user profile and setup WebSocket
  useEffect(() => {
    const savedUser = localStorage.getItem('userProfile');
    if (!savedUser) {
      setLocation('/login');
      return;
    }
    
    const profile = JSON.parse(savedUser);
    setUserProfile(profile);
    
    // Setup WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('Connected to WebSocket');
      // Use meeting-style join message
      socket.send(JSON.stringify({
        type: 'user_joined',
        meetingId: chatId,
        userName: profile.name,
        userAvatar: profile.avatar,
        isHost: false
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        const newMessage = {
          id: Date.now().toString(),
          text: data.message,
          sender: data.senderName || 'مستخدم',
          timestamp: new Date(),
          isUser: data.isFromRealUser && data.senderName === profile.name,
          reactions: []
        };
        setMessages(prev => [...prev, newMessage]);
      } else if (data.type === 'user_joined' && data.user) {
        if (data.user.name !== profile.name) {
          setConnectedUsers(prev => new Set([...Array.from(prev), data.user.id]));
          toast({
            title: "مستخدم جديد انضم",
            description: `${data.user.name} انضم للشات`,
          });
        }
      }
    };
    
    wsRef.current = socket;
    
    // Load chat room from localStorage
    const savedChats = JSON.parse(localStorage.getItem('personalChats') || '[]');
    const currentChat = savedChats.find((chat: ChatRoom) => chat.id === chatId);
    
    if (currentChat) {
      setChatRoom(currentChat);
      setMessages(currentChat.messages || []);
    } else {
      // Create new chat room
      const newChatRoom: ChatRoom = {
        id: chatId!,
        name: `شات ${profile.name}`,
        owner: profile.name,
        createdAt: new Date(),
        messages: [],
        participants: [{
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          isOnline: true,
          lastSeen: new Date()
        }]
      };
      
      setChatRoom(newChatRoom);
      saveChatRoom(newChatRoom);
    }
    
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'leave',
          chatId: chatId,
          userId: profile.id
        }));
        socket.close();
      }
    };
  }, [chatId, setLocation, toast]);

  const saveChatRoom = (roomToSave: ChatRoom) => {
    const savedChats = JSON.parse(localStorage.getItem('personalChats') || '[]');
    const updatedChats = savedChats.filter((chat: ChatRoom) => chat.id !== roomToSave.id);
    updatedChats.push(roomToSave);
    localStorage.setItem('personalChats', JSON.stringify(updatedChats));
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !chatRoom || !userProfile) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      sender: userProfile.name,
      timestamp: new Date(),
      isUser: true,
      reactions: []
    };

    // Send via WebSocket using meeting format
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        meetingId: chatId,
        senderName: userProfile.name,
        senderAvatar: userProfile.avatar,
        message: newMessage
      }));
    }

    // Update local state
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    
    const updatedRoom = { ...chatRoom, messages: updatedMessages };
    setChatRoom(updatedRoom);
    saveChatRoom(updatedRoom);
    
    setNewMessage("");
  };

  const copyShareLink = async () => {
    const shareLink = `${window.location.origin}/chat/${chatId}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "تم نسخ الرابط! 🎉",
        description: "يمكنك الآن مشاركة الرابط مع الآخرين",
        variant: "default",
      });
    } catch {
      toast({
        title: "فشل في نسخ الرابط",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chatRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <p>جاري تحميل الشات...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div 
      className="min-h-screen text-white transition-all duration-300" 
      style={{ background: userProfile.chatBackground }}
      dir="rtl"
    >
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-4">
            <Button
              onClick={() => setLocation('/home')}
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <i className="fas fa-arrow-right"></i>
            </Button>
            <div className="flex items-center space-x-reverse space-x-3">
              <Avatar className="w-12 h-12 bg-gradient-to-r from-pink-500 to-yellow-500 shadow-lg">
                <AvatarFallback className="bg-transparent text-white text-lg">
                  {userProfile.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{chatRoom.name}</h1>
                <p className="text-sm opacity-75">شات شخصي - {userProfile.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="flex items-center space-x-reverse space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm opacity-75">{connectedUsers.size + 1} متصل</span>
            </div>
            <Button
              onClick={copyShareLink}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <i className="fas fa-share mr-2"></i>
              شارك الرابط
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto p-4 h-screen flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 bg-black/10 backdrop-blur-xl rounded-2xl border border-white/10 mb-4 overflow-hidden">
          <div className="p-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-rocket text-3xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">مرحباً بك في شاتك الخاص!</h3>
                  <p className="text-white/70">ابدأ محادثة إبداعية الآن</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-reverse space-x-3">
                    {!message.isUser && (
                      <Avatar className="w-8 h-8 bg-white/20 flex-shrink-0">
                        <AvatarFallback className="bg-transparent text-white text-sm">
                          🤖
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-md px-6 py-3 rounded-2xl shadow-lg ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white transform hover:scale-105 transition-transform'
                          : 'bg-white/20 backdrop-blur-sm text-white border border-white/20'
                      }`}
                    >
                      {!message.isUser && (
                        <div className="text-xs font-medium mb-2 opacity-75">
                          {message.sender}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {message.isUser && (
                      <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
                        <AvatarFallback className="bg-transparent text-white text-sm">
                          {userProfile.avatar}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="mt-6 flex items-center space-x-reverse space-x-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="اكتب رسالتك الإبداعية هنا... ✨"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 rounded-2xl pl-6 pr-16 py-4 focus:border-white/50 focus:ring-white/30"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-magic text-white/40"></i>
                </div>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-200"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-black/20 backdrop-blur-sm border-white/10 text-white p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{messages.length}</div>
            <div className="text-xs opacity-75">الرسائل</div>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-white/10 text-white p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{chatRoom.participants.length}</div>
            <div className="text-xs opacity-75">المشاركون</div>
          </Card>
          <Card className="bg-black/20 backdrop-blur-sm border-white/10 text-white p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {new Date(chatRoom.createdAt).toLocaleDateString('ar-SA')}
            </div>
            <div className="text-xs opacity-75">تاريخ الإنشاء</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PersonalChat() {
  return (
    <AuthWrapper>
      <PersonalChatContent />
    </AuthWrapper>
  );
}