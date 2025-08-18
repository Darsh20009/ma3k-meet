import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ParticipantManagement from "./participant-management";
import ChatSidebar from "./chat-sidebar";
import MeetingCodeDisplay from "./meeting-code-display";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Meeting, VirtualParticipant } from "@shared/schema";

interface SimpleMeetingInterfaceProps {
  meeting: Meeting;
  onLeave: () => void;
}

export default function SimpleMeetingInterface({ meeting, onLeave }: SimpleMeetingInterfaceProps) {
  const { toast } = useToast();
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Basic meeting controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI states
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Session users tracking
  const [sessionUsers, setSessionUsers] = useState<{id: string, name: string, joinedAt: Date}[]>([]);
  
  // Get participants data
  const { data: participants = [] } = useQuery<VirtualParticipant[]>({
    queryKey: ['/api/meetings', meeting.id, 'participants'],
  });

  // Get real users
  const { data: realUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/meetings', meeting.id, 'users'],
    refetchInterval: 3000,
  });

  // Get messages
  const { data: fetchedMessages = [] } = useQuery<any[]>({
    queryKey: ['/api/meetings', meeting.id, 'messages'],
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (fetchedMessages && fetchedMessages.length > 0) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages?.length]);

  // Simple message sending function
  const sendMessage = (text: string, senderName?: string, senderAvatar?: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      sender: senderName || userName,
      avatar: senderAvatar || '👤',
      timestamp: new Date().toISOString(),
      isBot: !!senderName
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Simple auto-messaging for virtual participants  
  useEffect(() => {
    if (participants.length > 0) {
      const interval = setInterval(() => {
        const activeParticipants = participants.filter(p => p.status === 'active');
        if (activeParticipants.length > 0 && Math.random() < 0.3) {
          const randomParticipant = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
          const messages = [
            'مرحباً بالجميع! 👋',
            'أتفق مع هذا الاقتراح تماماً',
            'هل يمكننا مناقشة هذه النقطة بالتفصيل؟',
            'شكراً لك على هذا التوضيح المفيد',
            'فكرة رائعة ومبتكرة! 💡',
            'دعني أشارككم رأيي في هذا الموضوع',
            'هذا سؤال ممتاز، شكراً لك',
            'أعتقد أن هذا الحل سيناسب احتياجاتنا',
            'هل يمكن أن نستخدم طريقة أخرى؟',
            'سعيد بالمشاركة معكم اليوم',
            'أقترح أن نفكر في البدائل الأخرى',
            'ممتاز! هذا ما كنت أفكر فيه بالضبط'
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          sendMessage(randomMessage, randomParticipant.name, randomParticipant.avatar);
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [participants?.length, sendMessage]);

  // Simple controls
  const toggleMicrophone = () => {
    setIsMicOn(!isMicOn);
    toast({
      title: isMicOn ? "تم كتم الصوت" : "تم تشغيل الصوت",
      description: isMicOn ? "تم إيقاف الميكروفون" : "تم تشغيل الميكروفون",
    });
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast({
      title: isVideoOn ? "تم إيقاف الكاميرا" : "تم تشغيل الكاميرا",
      description: isVideoOn ? "تم إخفاء الفيديو" : "تم تشغيل الفيديو",
    });
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      title: isScreenSharing ? "تم إيقاف المشاركة" : "تم بدء المشاركة",
      description: isScreenSharing ? "تم إيقاف مشاركة الشاشة" : "تم بدء مشاركة الشاشة",
    });
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await meetingContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const shareInviteLink = async () => {
    const shareUrl = `${window.location.origin}/join/${meeting.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الدعوة للاجتماع",
      });
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "لم نتمكن من نسخ الرابط",
        variant: "destructive"
      });
    }
  };

  const userName = localStorage.getItem('userName') || 'مستخدم';

  // Add participant mutation
  const addParticipantMutation = useMutation({
    mutationFn: async (participantData: { name: string; role: string; status: 'active' | 'away' | 'offline' }) => {
      const response = await fetch(`/api/meetings/${meeting.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: participantData.name,
          role: participantData.role,
          status: participantData.status,
          avatar: '👤'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add participant');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/meetings', meeting.id, 'participants']
      });
      setShowAddParticipant(false);
      toast({
        title: "تم إضافة المشارك",
        description: "تم إضافة المشارك الافتراضي بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المشارك",
        variant: "destructive"
      });
    }
  });

  // Handle add participant form
  const handleAddParticipant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const status = formData.get('status') as 'active' | 'away' | 'offline';
    
    if (name && role && status) {
      addParticipantMutation.mutate({ name, role, status });
    }
  };

  return (
    <div ref={meetingContainerRef} className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm p-4 border-b border-gray-600/50 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <i className="fas fa-video text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{meeting.name}</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <i className="fas fa-key text-xs"></i>
                كود الاجتماع: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-green-400">{meeting.meetingCode}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowParticipants(!showParticipants)}
              variant="outline"
              size="sm"
              className={`transition-all duration-300 ${
                showParticipants 
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                  : 'border-gray-600 hover:border-purple-500 hover:text-purple-300'
              }`}
            >
              <i className="fas fa-users mr-2"></i>
              المشاركون ({realUsers.length + participants.length})
            </Button>
            <Button
              onClick={() => setShowChat(!showChat)}
              variant="outline"
              size="sm"
              className={`transition-all duration-300 ${
                showChat 
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                  : 'border-gray-600 hover:border-blue-500 hover:text-blue-300'
              }`}
            >
              <i className="fas fa-comments mr-2"></i>
              الدردشة
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Your Video */}
            <div className="bg-gray-800 rounded-lg relative aspect-video overflow-hidden border-2 border-blue-500/30">
              {/* Creative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              
              {/* Your avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 border-white/20">
                  👤
                </div>
              </div>
              
              {/* Your info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-white font-semibold text-sm">{userName} (أنت)</div>
                  <div className="flex items-center gap-2 mt-1">
                    {isMicOn ? (
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <i className="fas fa-microphone"></i>
                        <span>الميكروفون مفتوح</span>
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <i className="fas fa-microphone-slash"></i>
                        <span>مكتوم</span>
                      </div>
                    )}
                    {!isVideoOn && (
                      <div className="bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <i className="fas fa-video-slash"></i>
                        <span>الكاميرا مغلقة</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Real Users */}
            {realUsers.map((user, index) => {
              const userGradients = [
                'from-green-500 to-emerald-500',
                'from-blue-500 to-sky-500',
                'from-purple-500 to-violet-500',
                'from-orange-500 to-amber-500'
              ];
              const gradient = userGradients[index % userGradients.length];
              
              return (
                <div key={user.id} className="bg-gray-800 rounded-lg relative aspect-video overflow-hidden border-2 border-green-500/30">
                  {/* Creative background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Online indicator */}
                  <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  
                  {/* User avatar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-3xl shadow-2xl border-4 border-white/20`}>
                      👥
                    </div>
                  </div>
                  
                  {/* User info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="text-white font-semibold text-sm">{user.name}</div>
                      <div className="text-green-300 text-xs flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        متصل
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Virtual Participants */}
            {participants.map((participant, index) => {
              // Create creative avatars based on participant type and index
              const avatarEmojis = ['👨‍💼', '👩‍💻', '👨‍🎨', '👩‍🔬', '👨‍🏫', '👩‍⚕️', '👨‍🚀', '👩‍🎓'];
              const gradients = [
                'from-purple-500 to-pink-500',
                'from-blue-500 to-cyan-500', 
                'from-green-500 to-teal-500',
                'from-orange-500 to-red-500',
                'from-indigo-500 to-purple-500',
                'from-yellow-500 to-orange-500',
                'from-pink-500 to-rose-500',
                'from-cyan-500 to-blue-500'
              ];
              
              const avatar = avatarEmojis[index % avatarEmojis.length];
              const gradient = gradients[index % gradients.length];
              
              return (
                <div key={participant.id} className="bg-gray-700 rounded-lg relative aspect-video overflow-hidden">
                  {/* Creative background pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Animated floating particles */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="absolute top-8 right-8 w-1 h-1 bg-white/20 rounded-full animate-ping"></div>
                  
                  {/* Status indicator */}
                  <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                    participant.status === 'active' ? 'bg-green-400' :
                    participant.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                  } shadow-lg`}></div>
                  
                  {/* Creative avatar display */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-3xl shadow-2xl border-4 border-white/20`}>
                      {avatar}
                    </div>
                  </div>
                  
                  {/* Participant info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="text-white font-semibold text-sm">{participant.name}</div>
                      <div className="text-gray-300 text-xs flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          participant.status === 'active' ? 'bg-green-400' :
                          participant.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}></div>
                        {participant.status === 'active' ? 'نشط' : 
                         participant.status === 'away' ? 'غائب' : 'غير متصل'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-l border-gray-600/50 shadow-2xl">
            {/* Participants Header */}
            <div className="p-4 border-b border-gray-600/50 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">المشاركون</h3>
                  <p className="text-xs text-gray-400">إجمالي: {realUsers.length + participants.length} مشارك</p>
                </div>
              </div>
            </div>
            
            {/* Meeting Code Display */}
            <div className="p-4 border-b border-gray-600/30">
              <div className="bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-xl p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">كود الاجتماع</div>
                  <div className="font-mono text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    {meeting.meetingCode}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{meeting.name}</div>
                </div>
              </div>
            </div>
            
            {/* Participants List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Real Users Section */}
              {realUsers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h4 className="text-sm font-semibold text-green-400">المشاركون المتصلون ({realUsers.length})</h4>
                  </div>
                  {realUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-green-600/10 rounded-xl border border-green-600/20">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-lg">
                        👥
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-green-300 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          متصل الآن
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Virtual Participants Section */}
              {participants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <h4 className="text-sm font-semibold text-purple-400">المشاركون الافتراضيون ({participants.length})</h4>
                    </div>
                    <Button
                      onClick={() => setShowAddParticipant(true)}
                      size="sm"
                      className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 h-8 px-3 text-xs"
                    >
                      <i className="fas fa-plus ml-1"></i>
                      إضافة
                    </Button>
                  </div>
                  {participants.map((participant, index) => {
                    const avatarEmojis = ['👨‍💼', '👩‍💻', '👨‍🎨', '👩‍🔬', '👨‍🏫', '👩‍⚕️', '👨‍🚀', '👩‍🎓'];
                    const avatar = avatarEmojis[index % avatarEmojis.length];
                    
                    return (
                      <div key={participant.id} className="flex items-center gap-3 p-3 bg-purple-600/10 rounded-xl border border-purple-600/20">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg">
                          {avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{participant.name}</div>
                          <div className={`text-xs flex items-center gap-1 ${
                            participant.status === 'active' ? 'text-green-300' :
                            participant.status === 'away' ? 'text-yellow-300' : 'text-gray-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              participant.status === 'active' ? 'bg-green-400' :
                              participant.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                            }`}></div>
                            {participant.status === 'active' ? 'نشط' : 
                             participant.status === 'away' ? 'غائب' : 'غير متصل'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Empty state for virtual participants */}
              {participants.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <i className="fas fa-users text-4xl opacity-50 mb-3"></i>
                    <p className="text-sm">لا يوجد مشاركون افتراضيون</p>
                  </div>
                  <Button
                    onClick={() => setShowAddParticipant(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <i className="fas fa-plus ml-2"></i>
                    إضافة أول مشارك
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Participant Modal */}
        {showAddParticipant && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-600/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-600/50 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-plus text-white"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">إضافة مشارك افتراضي</h3>
                      <p className="text-xs text-gray-400">أضف مشارك جديد إلى الاجتماع</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowAddParticipant(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <form onSubmit={handleAddParticipant} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      اسم المشارك
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="أدخل اسم المشارك"
                      required
                      className="w-full bg-gray-700/80 text-white rounded-xl px-4 py-3 border border-gray-600/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      الوظيفة
                    </label>
                    <select
                      name="role"
                      required
                      className="w-full bg-gray-700/80 text-white rounded-xl px-4 py-3 border border-gray-600/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                    >
                      <option value="">اختر الوظيفة</option>
                      <option value="مهندس">مهندس</option>
                      <option value="مصمم">مصمم</option>
                      <option value="مطور">مطور</option>
                      <option value="مدير">مدير</option>
                      <option value="مسوق">مسوق</option>
                      <option value="محاسب">محاسب</option>
                      <option value="باحث">باحث</option>
                      <option value="مستشار">مستشار</option>
                      <option value="طالب">طالب</option>
                      <option value="معلم">معلم</option>
                    </select>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      الحالة
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600/30 cursor-pointer hover:bg-green-600/10 hover:border-green-600/50 transition-all duration-300">
                        <input type="radio" name="status" value="active" defaultChecked className="text-green-500" />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-400">نشط</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600/30 cursor-pointer hover:bg-yellow-600/10 hover:border-yellow-600/50 transition-all duration-300">
                        <input type="radio" name="status" value="away" className="text-yellow-500" />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <span className="text-sm text-yellow-400">غائب</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600/30 cursor-pointer hover:bg-gray-600/20 hover:border-gray-600/70 transition-all duration-300">
                        <input type="radio" name="status" value="offline" className="text-gray-400" />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-400">غير متصل</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => setShowAddParticipant(false)}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={addParticipantMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {addParticipantMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin ml-2"></i>
                          جاري الإضافة...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus ml-2"></i>
                          إضافة المشارك
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-l border-gray-600/50 shadow-2xl">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-600/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-comments text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">الدردشة</h3>
                    <p className="text-xs text-gray-400">رسائل الاجتماع المباشرة</p>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <i className="fas fa-comment-dots text-4xl mb-4 opacity-50"></i>
                    <p>لم يتم إرسال أي رسائل بعد</p>
                    <p className="text-sm">ابدأ المحادثة الآن!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {message.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-300">{message.sender}</span>
                            {message.isBot && (
                              <span className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded-full">
                                مشارك افتراضي
                              </span>
                            )}
                          </div>
                          <div className="bg-gradient-to-r from-gray-700/80 to-gray-600/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-3 shadow-lg border border-gray-600/30">
                            <p className="text-sm text-white leading-relaxed">{message.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-gray-600/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="اكتب رسالتك هنا..."
                      className="w-full bg-gray-700/80 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-sm border border-gray-600/50 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          sendMessage(e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <i className="fas fa-keyboard text-xs"></i>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling?.querySelector('input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        sendMessage(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <i className="fas fa-paper-plane"></i>
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm p-6 border-t border-gray-600/50 shadow-2xl">
        <div className="flex justify-center items-center gap-6">
          {/* Primary Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleMicrophone}
              className={`w-14 h-14 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isMicOn 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
              }`}
            >
              <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`}></i>
            </Button>

            <Button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isVideoOn
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
              }`}
            >
              <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'} text-lg`}></i>
            </Button>

            <Button
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isScreenSharing
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
              }`}
            >
              <i className="fas fa-desktop text-lg"></i>
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-600"></div>

          {/* Secondary Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={shareInviteLink}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <i className="fas fa-share text-lg"></i>
            </Button>

            <Button
              onClick={toggleFullscreen}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-lg`}></i>
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-600"></div>

          {/* Leave Button */}
          <Button
            onClick={onLeave}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <i className="fas fa-phone-slash text-xl"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}