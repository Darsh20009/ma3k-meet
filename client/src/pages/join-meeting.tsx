import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MeetingInterface from "@/components/meeting-interface";
import { useToast } from "@/hooks/use-toast";
import type { Meeting } from "@shared/schema";

export default function JoinMeeting() {
  const [, params] = useRoute("/meeting/:meetingId");
  const [userName, setUserName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const { toast } = useToast();

  const { data: meeting, isLoading, error } = useQuery<Meeting>({
    queryKey: ['/api/meetings', params?.meetingId],
    enabled: !!params?.meetingId
  });

  const joinMeeting = () => {
    if (!userName.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال اسمك للانضمام للاجتماع",
        variant: "destructive"
      });
      return;
    }
    
    // Store user name in localStorage for the session
    localStorage.setItem('userName', userName.trim());
    setHasJoined(true);
  };

  const leaveMeeting = () => {
    setHasJoined(false);
    localStorage.removeItem('userName');
  };

  // Auto-load saved username
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-video text-primary text-xl"></i>
          </div>
          <p className="text-gray-600">جارِ تحميل معلومات الاجتماع...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
            </div>
            <CardTitle className="text-red-600">اجتماع غير موجود</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              لا يمكن العثور على الاجتماع المطلوب. قد يكون الرابط غير صحيح أو انتهت صلاحيته.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasJoined) {
    return <MeetingInterface meeting={meeting} onLeave={leaveMeeting} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              مع
            </div>
            <span className="mr-3 text-xl font-bold text-gray-800">معك ميتيجس</span>
          </div>
          <div className="text-sm text-gray-600">
            الانضمام إلى اجتماع
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-video text-white text-xl"></i>
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">
              الانضمام إلى الاجتماع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-2">{meeting.name}</h3>
              <p className="text-sm text-gray-600">{meeting.type}</p>
              <div className="flex items-center justify-center mt-3">
                <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                  <i className="fas fa-circle text-xs mr-1"></i>
                  اجتماع نشط
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسمك في الاجتماع
              </label>
              <Input
                type="text"
                placeholder="أدخل اسمك هنا"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    joinMeeting();
                  }
                }}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                سيظهر اسمك للمشاركين الآخرين في الاجتماع
              </p>
            </div>

            <Button 
              onClick={joinMeeting}
              disabled={!userName.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3"
              size="lg"
            >
              <i className="fas fa-sign-in-alt ml-2"></i>
              الانضمام للاجتماع
            </Button>

            <div className="text-center">
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-arrow-right ml-2"></i>
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Preview */}
        <Card className="mt-6">
          <CardHeader>
            <h4 className="font-semibold text-gray-800">معاينة الاجتماع</h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">النوع:</span>
                <p className="font-medium">{meeting.type}</p>
              </div>
              <div>
                <span className="text-gray-600">تاريخ الإنشاء:</span>
                <p className="font-medium">
                  {meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">سرعة الرسائل:</span>
                <p className="font-medium">
                  {meeting.settings?.messageSpeed === 'fast' ? 'سريع' : 
                   meeting.settings?.messageSpeed === 'slow' ? 'بطيء' : 'متوسط'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">نوع المحادثة:</span>
                <p className="font-medium">
                  {meeting.settings?.conversationType === 'formal' ? 'رسمية' : 
                   meeting.settings?.conversationType === 'technical' ? 'تقنية' : 'ودية'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}