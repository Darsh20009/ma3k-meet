import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Meeting, InsertUser } from "@shared/schema";

export default function JoinSharedMeeting() {
  const [meetingId] = useParams() as [string];
  const [, setLocation] = useLocation();
  const [userName, setUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved user name
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  // Fetch meeting details
  const { data: meeting, isLoading, error } = useQuery<Meeting>({
    queryKey: [`/api/meetings/${meetingId}`],
    enabled: !!meetingId
  });

  // Join meeting mutation
  const joinMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await fetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to join meeting');
      }
      
      return response.json();
    },
    onSuccess: (user) => {
      // Save user name
      localStorage.setItem('userName', userName);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/session-users`] });
      
      toast({
        title: "تم الانضمام بنجاح",
        description: `مرحباً ${userName}! تم الانضمام للاجتماع`,
      });

      // Redirect to meeting
      setLocation(`/meeting/${meetingId}`);
    },
    onError: (error) => {
      console.error('Error joining meeting:', error);
      toast({
        title: "خطأ في الانضمام",
        description: "حدث خطأ أثناء محاولة الانضمام للاجتماع",
        variant: "destructive"
      });
    }
  });

  const handleJoinMeeting = () => {
    if (!userName.trim()) {
      toast({
        title: "الرجاء إدخال الاسم",
        description: "يجب إدخال اسمك للانضمام للاجتماع",
        variant: "destructive"
      });
      return;
    }

    if (!meeting) {
      toast({
        title: "الاجتماع غير موجود",
        description: "لم يتم العثور على الاجتماع المطلوب",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    
    joinMutation.mutate({
      meetingId: meeting.id,
      name: userName.trim(),
      avatar: userName.trim().slice(0, 2).toUpperCase(),
      isOnline: true,
      status: 'online'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري تحميل معلومات الاجتماع...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="bg-gradient-to-r from-slate-800/90 via-purple-800/60 to-slate-800/90 backdrop-blur-lg border border-purple-700/30 rounded-xl p-8 text-center max-w-md mx-4">
          <div className="text-red-400 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h1 className="text-white text-xl font-bold mb-2">الاجتماع غير موجود</h1>
          <p className="text-gray-300 mb-6">لم يتم العثور على الاجتماع المطلوب أو انتهت صلاحيته</p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-75"></div>
      </div>

      <div className="bg-gradient-to-r from-slate-800/90 via-purple-800/60 to-slate-800/90 backdrop-blur-lg border border-purple-700/30 rounded-xl p-8 max-w-md w-full mx-4 relative z-10 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative group mb-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl mx-auto">
              <i className="fas fa-video"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
            الانضمام للاجتماع
          </h1>
          <p className="text-gray-300 text-sm">تم دعوتك للانضمام لاجتماع</p>
        </div>

        {/* Meeting Info */}
        <div className="bg-gradient-to-r from-white/10 to-purple-50/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
          <h2 className="text-white font-semibold text-lg mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {meeting.name}
          </h2>
          <div className="flex items-center text-purple-200 text-sm space-x-reverse space-x-2">
            <i className="fas fa-calendar-alt text-purple-400"></i>
            <span>نوع: {meeting.type}</span>
          </div>
          <div className="flex items-center text-purple-200 text-sm mt-1 space-x-reverse space-x-2">
            <i className="fas fa-clock text-purple-400"></i>
            <span>تم الإنشاء: {meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString('ar') : 'غير محدد'}</span>
          </div>
        </div>

        {/* Join Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-purple-200 text-sm font-medium mb-2">
              اسمك في الاجتماع
            </label>
            <Input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="أدخل اسمك هنا"
              className="w-full bg-gradient-to-r from-slate-700/50 to-purple-700/30 border-purple-500/30 text-white placeholder-purple-300/70 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg"
              maxLength={50}
            />
          </div>

          <Button
            onClick={handleJoinMeeting}
            disabled={isJoining || joinMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg shadow-purple-600/30"
          >
            {isJoining || joinMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                جاري الانضمام...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt ml-2"></i>
                الانضمام للاجتماع
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="w-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors duration-300"
          >
            إلغاء
          </Button>
        </div>

        {/* Meeting Code Display */}
        <div className="mt-6 pt-6 border-t border-purple-700/30">
          <div className="text-center">
            <p className="text-purple-200 text-xs mb-2">كود الاجتماع</p>
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg px-4 py-2 inline-block">
              <span className="text-white font-mono text-lg tracking-wider">
                {meetingId.substring(0, 6).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}