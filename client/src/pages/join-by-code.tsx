import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Meeting } from "@shared/schema";

export default function JoinByCode() {
  const [, setLocation] = useLocation();
  const [meetingCode, setMeetingCode] = useState("");
  const [userName, setUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  // Get all meetings to find by code
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const findMeetingByCode = (code: string) => {
    if (!code || code.length !== 6) return null;
    
    return meetings.find(meeting => {
      const hash = meeting.id.split('-')[0];
      const numbers = hash.match(/\d/g) || [];
      let meetingCodeGenerated = numbers.join('').slice(0, 6);
      
      // Ensure we have 6 digits
      if (meetingCodeGenerated.length < 6) {
        const chars = hash.replace(/[^a-f0-9]/g, '');
        for (let i = 0; i < chars.length && meetingCodeGenerated.length < 6; i++) {
          const char = chars[i];
          if (/[0-9]/.test(char)) {
            meetingCodeGenerated += char;
          } else {
            meetingCodeGenerated += (parseInt(char, 16) % 10).toString();
          }
        }
      }
      
      return meetingCodeGenerated.slice(0, 6) === code;
    });
  };

  const joinMeeting = async () => {
    if (!meetingCode.trim() || meetingCode.length !== 6) {
      toast({
        title: "رمز غير صحيح",
        description: "يرجى إدخال رمز الاجتماع المكون من 6 أرقام",
        variant: "destructive"
      });
      return;
    }

    if (!userName.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال اسمك للانضمام للاجتماع",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);

    try {
      const meeting = findMeetingByCode(meetingCode);
      
      if (!meeting) {
        toast({
          title: "اجتماع غير موجود",
          description: "لم يتم العثور على اجتماع بهذا الرمز",
          variant: "destructive"
        });
        return;
      }

      // Store user name and redirect to meeting
      localStorage.setItem('userName', userName.trim());
      setLocation(`/meeting/${meeting.id}`);
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء البحث عن الاجتماع",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setMeetingCode(cleanValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 px-4 sm:px-0" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              مع
            </div>
            <span className="mr-3 text-xl font-bold text-gray-800">معك ميتيجس</span>
          </div>
          <Button 
            onClick={() => setLocation('/')}
            variant="ghost"
            className="text-sm"
          >
            <i className="fas fa-arrow-right ml-2"></i>
            العودة للرئيسية
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-key text-white text-xl"></i>
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">
              انضم برمز الاجتماع
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              أدخل الرمز المكون من 6 أرقام الذي حصلت عليه من منظم الاجتماع
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meeting Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز الاجتماع
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={meetingCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-2xl font-mono tracking-wider h-14"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                6 أرقام فقط
              </p>
            </div>

            {/* User Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسمك
              </label>
              <Input
                type="text"
                placeholder="أدخل اسمك"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Join Button */}
            <Button
              onClick={joinMeeting}
              disabled={isJoining || meetingCode.length !== 6 || !userName.trim()}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold"
            >
              {isJoining ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  جارِ الانضمام...
                </div>
              ) : (
                <div className="flex items-center">
                  <i className="fas fa-sign-in-alt ml-2"></i>
                  انضم للاجتماع
                </div>
              )}
            </Button>

            {/* Alternative Options */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>

            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
            >
              <i className="fas fa-plus ml-2"></i>
              إنشاء اجتماع جديد
            </Button>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">كيفية الحصول على رمز الاجتماع؟</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• اطلب الرمز من منظم الاجتماع</p>
              <p>• الرمز مكون من 6 أرقام</p>
              <p>• يمكنك أيضاً استخدام الرابط المباشر</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}