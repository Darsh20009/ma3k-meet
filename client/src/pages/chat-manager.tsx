import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

interface ChatRoom {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
  messages: any[];
  participants: string[];
  lastActivity: Date;
}

export default function ChatManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [savedChats, setSavedChats] = useState<ChatRoom[]>([]);
  const [newChatName, setNewChatName] = useState("");
  const [userName, setUserName] = useState(() => 
    localStorage.getItem('meetUserName') || `مستخدم_${Math.floor(Math.random() * 1000)}`
  );

  useEffect(() => {
    loadSavedChats();
    localStorage.setItem('meetUserName', userName);
  }, [userName]);

  const loadSavedChats = () => {
    const saved = JSON.parse(localStorage.getItem('personalChats') || '[]');
    setSavedChats(saved.sort((a: ChatRoom, b: ChatRoom) => 
      new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime()
    ));
  };

  const createNewChat = () => {
    const chatId = nanoid(8);
    const chatName = newChatName.trim() || `شات ${userName}`;
    
    const newChat: ChatRoom = {
      id: chatId,
      name: chatName,
      owner: userName,
      createdAt: new Date(),
      lastActivity: new Date(),
      messages: [],
      participants: [userName]
    };

    const existingChats = JSON.parse(localStorage.getItem('personalChats') || '[]');
    existingChats.push(newChat);
    localStorage.setItem('personalChats', JSON.stringify(existingChats));
    
    setNewChatName("");
    toast({
      title: "تم إنشاء شات جديد! 🎉",
      description: `شات "${chatName}" جاهز للاستخدام`,
    });
    
    setLocation(`/chat/${chatId}`);
  };

  const deleteChat = (chatId: string) => {
    const existingChats = JSON.parse(localStorage.getItem('personalChats') || '[]');
    const updatedChats = existingChats.filter((chat: ChatRoom) => chat.id !== chatId);
    localStorage.setItem('personalChats', JSON.stringify(updatedChats));
    
    loadSavedChats();
    toast({
      title: "تم حذف الشات",
      description: "تم حذف الشات بنجاح",
      variant: "destructive",
    });
  };

  const copyShareLink = async (chatId: string, chatName: string) => {
    const shareLink = `${window.location.origin}/chat/${chatId}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "تم نسخ الرابط! 🎉",
        description: `رابط شات "${chatName}" جاهز للمشاركة`,
      });
    } catch {
      toast({
        title: "فشل في نسخ الرابط",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 p-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-4">
            <Button
              onClick={() => setLocation('/home')}
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20"
            >
              <i className="fas fa-arrow-right"></i>
            </Button>
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-comment-dots"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">إدارة الشاتات</h1>
                <p className="text-sm opacity-75">مرحباً {userName}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <Input
              type="text"
              placeholder="غير اسمك..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-40 bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Create New Chat */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-t-lg">
            <CardTitle className="flex items-center text-white">
              <i className="fas fa-plus-circle mr-3 text-green-400"></i>
              إنشاء شات جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-4">
              <Input
                type="text"
                placeholder="اسم الشات (اختياري)"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createNewChat();
                  }
                }}
              />
              <Button
                onClick={createNewChat}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg"
              >
                <i className="fas fa-rocket mr-2"></i>
                إنشاء شات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Chats */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/10">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-t-lg">
            <CardTitle className="flex items-center text-white">
              <i className="fas fa-history mr-3 text-purple-400"></i>
              الشاتات المحفوظة ({savedChats.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {savedChats.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                  <i className="fas fa-comments text-3xl text-white"></i>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white/70">لا توجد شاتات محفوظة</h3>
                <p className="text-white/50">أنشئ شاتك الأول لتبدأ المحادثة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-reverse space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <i className="fas fa-comment text-white"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-white truncate max-w-32">{chat.name}</h4>
                          <p className="text-xs text-white/60">{chat.owner}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteChat(chat.id)}
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </Button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs text-white/60">
                        <span>{chat.messages.length} رسالة</span>
                        <span>{chat.participants.length} مشارك</span>
                      </div>
                      <div className="text-xs text-white/50">
                        آخر نشاط: {new Date(chat.lastActivity || chat.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-reverse space-x-2">
                      <Button
                        onClick={() => setLocation(`/chat/${chat.id}`)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs"
                      >
                        <i className="fas fa-play mr-1"></i>
                        فتح
                      </Button>
                      <Button
                        onClick={() => copyShareLink(chat.id, chat.name)}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 text-xs"
                      >
                        <i className="fas fa-share"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}