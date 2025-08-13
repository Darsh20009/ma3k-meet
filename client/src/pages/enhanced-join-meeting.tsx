import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Shield, Users, Clock, Video, Mic, Monitor, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import MeetingSecurity from './meeting-security';
import { apiRequest } from '@/lib/queryClient';

interface Meeting {
  id: string;
  name: string;
  type: string;
  meetingCode: string;
  isPasswordProtected: boolean;
  maxParticipants: number;
  allowScreenShare: boolean;
  allowChat: boolean;
  waitingRoom: boolean;
  muteOnJoin: boolean;
  createdAt: string;
}

export default function EnhancedJoinMeeting() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [showSecurity, setShowSecurity] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const meetingCode = params.code || '';

  useEffect(() => {
    if (meetingCode && meetingCode.length === 6) {
      fetchMeetingInfo();
    } else {
      setShowSecurity(true);
      setIsLoading(false);
    }
  }, [meetingCode]);

  const fetchMeetingInfo = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/meetings/join', {
        method: 'POST',
        body: JSON.stringify({
          meetingCode,
          userName: 'Preview User' // Just for preview
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMeeting(data.meeting);
        
        // Get participant count
        const [participantsRes, usersRes] = await Promise.all([
          apiRequest(`/api/meetings/${data.meeting.id}/participants`),
          apiRequest(`/api/meetings/${data.meeting.id}/users`)
        ]);

        if (participantsRes.ok && usersRes.ok) {
          const [participants, users] = await Promise.all([
            participantsRes.json(),
            usersRes.json()
          ]);
          setParticipantCount(participants.length + users.length);
        }
      } else if (response.status === 403) {
        // Password required
        const data = await response.json();
        setShowSecurity(true);
      } else if (response.status === 404) {
        toast({
          title: "الاجتماع غير موجود",
          description: "تأكد من صحة كود الاجتماع",
          variant: "destructive",
        });
        setShowSecurity(true);
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "تأكد من اتصالك بالإنترنت",
        variant: "destructive",
      });
      setShowSecurity(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessGranted = (meetingId: string) => {
    setLocation(`/meeting/${meetingId}`);
  };

  if (showSecurity || !meeting) {
    return <MeetingSecurity meetingCode={meetingCode} onAccessGranted={handleAccessGranted} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="text-white text-lg">جاري تحميل معلومات الاجتماع...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-purple-400/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-from)_0%,_transparent_50%)] from-blue-400/20"></div>
      
      <Card className="w-full max-w-2xl bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Video className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            {meeting.name}
          </CardTitle>
          <CardDescription className="text-purple-200 text-lg">
            كود الاجتماع: {meeting.meetingCode}
          </CardDescription>
          <Badge variant="secondary" className="mx-auto mt-2 bg-purple-500/20 text-purple-200 border-purple-300/30">
            {meeting.type}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Meeting Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <Users className="h-6 w-6 text-purple-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{participantCount}</div>
              <div className="text-purple-200 text-sm">مشارك حالياً</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <Clock className="h-6 w-6 text-purple-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{meeting.maxParticipants}</div>
              <div className="text-purple-200 text-sm">حد أقصى</div>
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Meeting Features */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="h-5 w-5 ml-2" />
              إعدادات الاجتماع
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border ${
                meeting.allowScreenShare 
                  ? 'bg-green-500/10 border-green-400/30 text-green-200' 
                  : 'bg-red-500/10 border-red-400/30 text-red-200'
              }`}>
                <Monitor className="h-4 w-4" />
                <span className="text-sm">مشاركة الشاشة</span>
                <Badge variant={meeting.allowScreenShare ? "default" : "destructive"} className="mr-auto text-xs">
                  {meeting.allowScreenShare ? 'مفعل' : 'معطل'}
                </Badge>
              </div>

              <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border ${
                meeting.allowChat 
                  ? 'bg-green-500/10 border-green-400/30 text-green-200' 
                  : 'bg-red-500/10 border-red-400/30 text-red-200'
              }`}>
                <Users className="h-4 w-4" />
                <span className="text-sm">الدردشة</span>
                <Badge variant={meeting.allowChat ? "default" : "destructive"} className="mr-auto text-xs">
                  {meeting.allowChat ? 'مفعل' : 'معطل'}
                </Badge>
              </div>

              <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border ${
                meeting.muteOnJoin 
                  ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-200' 
                  : 'bg-green-500/10 border-green-400/30 text-green-200'
              }`}>
                <Mic className="h-4 w-4" />
                <span className="text-sm">الميكروفون</span>
                <Badge variant={meeting.muteOnJoin ? "secondary" : "default"} className="mr-auto text-xs">
                  {meeting.muteOnJoin ? 'كتم عند الدخول' : 'مفعل'}
                </Badge>
              </div>

              <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border ${
                meeting.isPasswordProtected 
                  ? 'bg-orange-500/10 border-orange-400/30 text-orange-200' 
                  : 'bg-green-500/10 border-green-400/30 text-green-200'
              }`}>
                <Lock className="h-4 w-4" />
                <span className="text-sm">الحماية</span>
                <Badge variant={meeting.isPasswordProtected ? "secondary" : "default"} className="mr-auto text-xs">
                  {meeting.isPasswordProtected ? 'محمي بكلمة مرور' : 'مفتوح'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Meeting Info */}
          <div className="text-center space-y-2">
            <p className="text-purple-200 text-sm">
              تم إنشاؤه في: {formatDate(meeting.createdAt)}
            </p>
            {meeting.waitingRoom && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-200 border-blue-300/30">
                غرفة انتظار مفعلة
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-6">
          <Button
            onClick={() => setShowSecurity(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            data-testid="button-join-meeting"
          >
            <Video className="h-5 w-5 ml-2" />
            انضمام للاجتماع الآن
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="w-full text-purple-200 hover:text-white hover:bg-white/10"
            data-testid="button-back-home"
          >
            العودة للصفحة الرئيسية
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}