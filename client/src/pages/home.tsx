import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MeetingInterface from "@/components/meeting-interface";
import EnhancedChat from "@/components/enhanced-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Meeting } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [newMeetingName, setNewMeetingName] = useState("");
  const [meetingType, setMeetingType] = useState("اجتماع عمل");
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [userName, setUserName] = useState(() => 
    localStorage.getItem('meetUserName') || 'مستخدم جديد'
  );

  const { data: meetings, refetch } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
    enabled: !currentMeeting
  });

  const createMeeting = async () => {
    if (!newMeetingName.trim()) return;

    try {
      const response = await apiRequest('POST', '/api/meetings', {
        name: newMeetingName,
        type: meetingType,
        settings: {
          messageSpeed: 'medium' as const,
          conversationType: 'friendly' as const,
          autoSounds: false
        }
      });

      const meeting = await response.json();
      setCurrentMeeting(meeting);
      setNewMeetingName("");
    } catch (error) {
      console.error('Failed to create meeting:', error);
    }
  };

  const joinMeeting = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
  };

  const leaveMeeting = () => {
    setCurrentMeeting(null);
    refetch();
  };

  if (currentMeeting) {
    return <MeetingInterface meeting={currentMeeting} onLeave={leaveMeeting} />;
  }

  if (showQuickChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          {/* Quick Chat Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <Button
                onClick={() => setShowQuickChat(false)}
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full"
              >
                <i className="fas fa-arrow-right"></i>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">💬 شات سريع</h1>
                <p className="text-gray-600">تواصل فوري وسهل</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              مرحباً {userName}
            </div>
          </div>

          <EnhancedChat meetingId="quick-chat" userName={userName} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              <i className="fas fa-video"></i>
            </div>
            <div>
              <span className="mr-3 text-xl font-bold text-white">Meet</span>
              <p className="text-xs text-white/70 mr-3">Powered by ma3k</p>
            </div>
          </div>
          <div className="text-sm text-white/80">
            منصة اجتماعات حديثة ومبتكرة
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create New Meeting */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur-sm shadow-xl border border-white/10">
              <CardHeader className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-t-lg">
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <i className="fas fa-plus-circle text-blue-600 mr-3"></i>
                  بدء جلسة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    اسم الاجتماع
                  </label>
                  <Input
                    type="text"
                    placeholder="اجتماع مشروع التطوير"
                    value={newMeetingName}
                    onChange={(e) => setNewMeetingName(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    نوع النشاط
                  </label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="اجتماع عمل">🤝 اجتماع عمل</SelectItem>
                      <SelectItem value="شات سريع">💬 شات سريع</SelectItem>
                      <SelectItem value="جلسة دراسية">📚 جلسة دراسية</SelectItem>
                      <SelectItem value="عصف ذهني">💡 عصف ذهني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {meetingType === "شات سريع" ? (
                  <Button 
                    onClick={() => setLocation('/chats')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <i className="fas fa-comments ml-2"></i>
                    إدارة الشاتات الشخصية
                  </Button>
                ) : (
                  <Button 
                    onClick={createMeeting}
                    disabled={!newMeetingName.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <i className="fas fa-video ml-2"></i>
                    ابدأ الاجتماع
                  </Button>
                )}

                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-black/20 text-white">أو</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setLocation('/join')}
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white font-medium"
                    >
                      <i className="fas fa-key ml-2"></i>
                      انضم برمز
                    </Button>
                    <Button
                      onClick={() => setLocation('/chats')}
                      variant="outline" 
                      className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white font-medium"
                    >
                      <i className="fas fa-comment-dots ml-2"></i>
                      شاتاتي
                    </Button>
                  </div>
                </div>


              </CardContent>
            </Card>

            {/* Features Overview */}
            <Card className="mt-6 bg-black/10 backdrop-blur-sm shadow-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center">
                  <i className="fas fa-star text-yellow-500 mr-3"></i>
                  مميزات Meet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-blue-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">مشاركون افتراضيون</h4>
                      <p className="text-sm text-white/70">إضافة وإدارة شخصيات افتراضية للاجتماع</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-comments text-green-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">شات سريع</h4>
                      <p className="text-sm text-white/70">تواصل فوري وبسيط مع أدوات ذكية</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-cog text-purple-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">إعدادات مخصصة</h4>
                      <p className="text-sm text-white/70">تحكم في سرعة ونوع المحادثات</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clock text-orange-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">اجتماعات واقعية</h4>
                      <p className="text-sm text-white/70">مؤقتات وإشعارات تبدو طبيعية</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Meetings */}
          <div>
            <Card className="bg-black/20 backdrop-blur-sm shadow-xl border border-white/10">
              <CardHeader className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-t-lg">
                <CardTitle className="text-lg font-bold text-white flex items-center">
                  <i className="fas fa-broadcast-tower text-green-600 mr-3"></i>
                  الجلسات النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meetings && meetings.length > 0 ? (
                  <div className="space-y-3">
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                        onClick={() => joinMeeting(meeting)}
                      >
                        <h4 className="font-medium text-white">{meeting.name}</h4>
                        <p className="text-sm text-white/70">{meeting.type}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-reverse space-x-2">
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              نشط
                            </span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const shareUrl = `${window.location.origin}/meeting/${meeting.id}`;
                                
                                // Try native share first (mobile)
                                if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                                  try {
                                    await navigator.share({
                                      title: `اجتماع: ${meeting.name}`,
                                      text: 'انضم إلى الاجتماع',
                                      url: shareUrl,
                                    });
                                    return;
                                  } catch (err) {
                                    // Fall back to clipboard
                                  }
                                }
                                
                                // Clipboard fallback
                                try {
                                  await navigator.clipboard.writeText(shareUrl);
                                } catch (err) {
                                  console.log('Clipboard failed, URL copied to selection');
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                              title="نسخ رابط المشاركة"
                            >
                              <i className="fas fa-share text-xs ml-1"></i>
                              مشاركة
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {meeting.createdAt ? new Date(meeting.createdAt).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-video text-white/50 text-xl"></i>
                    </div>
                    <p className="text-white/70 text-sm">لا توجد اجتماعات نشطة</p>
                    <p className="text-white/50 text-xs mt-1">ابدأ اجتماعاً جديداً للبدء</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
