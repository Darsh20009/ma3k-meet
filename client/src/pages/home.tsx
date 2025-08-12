import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MeetingInterface from "@/components/meeting-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Meeting } from "@shared/schema";

export default function Home() {
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [newMeetingName, setNewMeetingName] = useState("");
  const [meetingType, setMeetingType] = useState("اجتماع عمل");

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              مع
            </div>
            <span className="mr-3 text-xl font-bold text-gray-800">معك ميتيجس</span>
          </div>
          <div className="text-sm text-gray-600">
            منصة الاجتماعات الافتراضية الاحترافية
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create New Meeting */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  إنشاء اجتماع جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الاجتماع
                  </label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="اجتماع عمل">اجتماع عمل</SelectItem>
                      <SelectItem value="جلسة دراسية">جلسة دراسية</SelectItem>
                      <SelectItem value="مراجعة مشروع">مراجعة مشروع</SelectItem>
                      <SelectItem value="عصف ذهني">عصف ذهني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={createMeeting}
                  disabled={!newMeetingName.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <i className="fas fa-plus ml-2"></i>
                  ابدأ الاجتماع
                </Button>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">أو</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setLocation('/join')}
                    variant="outline"
                    className="w-full text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                  >
                    <i className="fas fa-key ml-2"></i>
                    انضم برمز الاجتماع
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features Overview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800">
                  مميزات معك ميتيجس
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-blue-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">مشاركون افتراضيون</h4>
                      <p className="text-sm text-gray-600">إضافة وإدارة شخصيات افتراضية للاجتماع</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-comments text-green-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">محادثات تلقائية</h4>
                      <p className="text-sm text-gray-600">رسائل ذكية ومحادثات واقعية</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-cog text-purple-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">إعدادات مخصصة</h4>
                      <p className="text-sm text-gray-600">تحكم في سرعة ونوع المحادثات</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-reverse space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clock text-orange-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">اجتماعات واقعية</h4>
                      <p className="text-sm text-gray-600">مؤقتات وإشعارات تبدو طبيعية</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Meetings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800">
                  الاجتماعات النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meetings && meetings.length > 0 ? (
                  <div className="space-y-3">
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => joinMeeting(meeting)}
                      >
                        <h4 className="font-medium text-gray-800">{meeting.name}</h4>
                        <p className="text-sm text-gray-600">{meeting.type}</p>
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
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-video text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-600 text-sm">لا توجد اجتماعات نشطة</p>
                    <p className="text-gray-500 text-xs mt-1">ابدأ اجتماعاً جديداً للبدء</p>
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
