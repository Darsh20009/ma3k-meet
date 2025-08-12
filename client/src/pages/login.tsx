import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  theme: string;
  chatBackground: string;
  createdAt: Date;
}

const avatarOptions = [
  "👨‍💻", "👩‍💻", "🧑‍🎨", "👨‍🎓", "👩‍🎓", "🧑‍💼", 
  "👨‍🔬", "👩‍🔬", "🧑‍🚀", "👨‍⚕️", "👩‍⚕️", "🧑‍🏫",
  "🤖", "👾", "🎯", "⭐", "🔥", "💎", "🚀", "🎨"
];

const backgroundOptions = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('userProfile');
    if (savedUser) {
      setLocation('/home');
      return;
    }
    
    setTimeout(() => setIsLoaded(true), 100);
  }, [setLocation]);

  const handleAuth = () => {
    if (!name.trim() || (!isLogin && !email.trim())) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const userProfile: UserProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim() || `${name.trim()}@ma3k.com`,
      avatar: selectedAvatar,
      theme: "dark",
      chatBackground: selectedBackground,
      createdAt: new Date()
    };

    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('meetUserName', userProfile.name);
    
    toast({
      title: "مرحباً بك! 🎉",
      description: `تم ${isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'} بنجاح`,
    });
    
    setTimeout(() => {
      setLocation('/home');
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-1000"
      style={{ background: selectedBackground }}
      dir="rtl"
    >
      <Card className={`w-full max-w-md bg-black/20 backdrop-blur-xl border-white/20 shadow-2xl transform transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-user-circle text-3xl text-white"></i>
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Meet powered by ma3k
          </CardTitle>
          <p className="text-white/70">
            {isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">الاسم</label>
            <Input
              type="text"
              placeholder="أدخل اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 focus:border-white/50 focus:ring-white/30"
            />
          </div>

          {/* Email Input (for registration) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">البريد الإلكتروني (اختياري)</label>
              <Input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 focus:border-white/50 focus:ring-white/30"
              />
            </div>
          )}

          {/* Avatar Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">اختر صورتك الشخصية</label>
            <div className="grid grid-cols-6 gap-2">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                    selectedAvatar === avatar
                      ? 'bg-white/30 scale-110 ring-2 ring-white/50'
                      : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Background Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">اختر خلفية الشات</label>
            <div className="grid grid-cols-4 gap-2">
              {backgroundOptions.map((bg, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedBackground(bg)}
                  className={`w-12 h-8 rounded-lg transition-all duration-200 ${
                    selectedBackground === bg
                      ? 'scale-110 ring-2 ring-white/50'
                      : 'hover:scale-105'
                  }`}
                  style={{ background: bg }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
            <div className="text-sm font-medium text-white/80">معاينة الملف الشخصي</div>
            <div className="flex items-center space-x-reverse space-x-3">
              <Avatar className="w-12 h-12 bg-white/20 text-lg">
                <AvatarFallback className="bg-transparent text-white">
                  {selectedAvatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold text-white">{name || "اسمك هنا"}</div>
                <div className="text-sm text-white/60">{email || `${name || "اسمك"}@ma3k.com`}</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleAuth}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            {isLogin ? 'دخول' : 'إنشاء حساب'}
          </Button>

          {/* Toggle Login/Register */}
          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/70 hover:text-white text-sm underline transition-colors duration-200"
            >
              {isLogin ? 'إنشاء حساب جديد؟' : 'لديك حساب بالفعل؟'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}