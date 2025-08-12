import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        
        {/* Logo Section */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl">
            <i className="fas fa-video text-3xl text-white"></i>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Meet
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">
            Powered by <span className="text-purple-400 font-semibold">ma3k</span>
          </p>
        </div>

        {/* Features Cards */}
        <div className={`grid md:grid-cols-2 gap-6 mb-12 max-w-4xl transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold mb-3">اجتماع جماعي</h3>
              <p className="text-gray-300">اجمع فريقك وابدأ اجتماعاً تفاعلياً مع جميع الأدوات المطلوبة</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comments text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold mb-3">شات شخصي</h3>
              <p className="text-gray-300">إنشاء شاتات خاصة برابط فريد مع حفظ دائم</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Button
            onClick={() => setLocation('/login')}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <i className="fas fa-rocket mr-3"></i>
            ابدأ الآن
          </Button>
          
          <Button
            onClick={() => setLocation('/login')}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <i className="fas fa-comments mr-3"></i>
            شاتاتي الشخصية
          </Button>
          
          <Button
            onClick={() => setLocation('/join')}
            variant="outline"
            size="lg"
            className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full backdrop-blur-sm transition-all duration-300 bg-[#613288]"
          >
            <i className="fas fa-sign-in-alt mr-3"></i>
            انضم لاجتماع
          </Button>
        </div>

        {/* Footer */}
        <div className={`mt-16 text-center text-gray-400 text-sm transform transition-all duration-1000 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <p>منصة اجتماعات حديثة ومبتكرة</p>
          <p className="mt-2">تم التطوير بـ <span className="text-red-400">♥</span> باستخدام أحدث التقنيات</p>
        </div>
      </div>
    </div>
  );
}