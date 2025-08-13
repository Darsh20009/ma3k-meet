import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { arabicParticipantTemplates } from "@/lib/virtual-participants";
import type { Meeting, VirtualParticipant, RealUser } from "@shared/schema";

interface ParticipantManagementProps {
  meeting: Meeting;
  showParticipants?: boolean;
  realUsers?: RealUser[];
}

export default function ParticipantManagement({ meeting, realUsers = [] }: ParticipantManagementProps) {
  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery<VirtualParticipant[]>({
    queryKey: ['/api/meetings', meeting.id, 'participants'],
  });

  const { data: fetchedRealUsers = [] } = useQuery<RealUser[]>({
    queryKey: ['/api/meetings', meeting.id, 'users'],
  });

  // Combine prop realUsers with fetched ones (prop takes priority for real-time updates)
  const allRealUsers = realUsers.length > 0 ? realUsers : fetchedRealUsers;

  const addParticipantMutation = useMutation({
    mutationFn: async (participantData: { name: string; avatar: string; personality: string }) => {
      const response = await apiRequest('POST', '/api/participants', {
        meetingId: meeting.id,
        name: participantData.name,
        avatar: participantData.avatar,
        status: 'active',
        personality: participantData.personality
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meeting.id, 'participants'] });
      setNewParticipantName("");
      setSelectedTemplate("");
    }
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      await apiRequest('DELETE', `/api/participants/${participantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meeting.id, 'participants'] });
    }
  });

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;

    let avatar = newParticipantName.trim().slice(0, 2);
    let personality = 'professional';

    if (selectedTemplate) {
      const template = arabicParticipantTemplates.find(t => t.name === selectedTemplate);
      if (template) {
        avatar = template.avatar;
        personality = template.personality;
      }
    }

    addParticipantMutation.mutate({
      name: newParticipantName.trim(),
      avatar,
      personality
    });
  };

  const addTemplateParticipant = () => {
    if (!selectedTemplate) return;

    const template = arabicParticipantTemplates.find(t => t.name === selectedTemplate);
    if (!template) return;

    addParticipantMutation.mutate({
      name: template.name,
      avatar: template.avatar,
      personality: template.personality
    });
  };

  const removeParticipant = (participantId: string) => {
    removeParticipantMutation.mutate(participantId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10';
      case 'away': return 'text-warning bg-warning/10';
      case 'offline': return 'text-gray-500 bg-gray-100';
      default: return 'text-success bg-success/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'away': return 'بعيد';
      case 'offline': return 'غير متصل';
      default: return 'نشط';
    }
  };

  const getParticipantIconStyle = (personality: string, avatar: string) => {
    const styles = {
      'professional': 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30',
      'friendly': 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30',
      'technical': 'bg-gradient-to-br from-purple-600 to-violet-700 shadow-lg shadow-purple-500/30',
      'creative': 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30',
      'manager': 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30',
      'student': 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30'
    };
    return styles[personality as keyof typeof styles] || styles.professional;
  };

  const getParticipantIcon = (personality: string, avatar: string) => {
    // If avatar contains emojis or special characters, use it
    if (avatar && (avatar.includes('🎨') || avatar.includes('👔') || avatar.includes('🎓') || avatar.length > 2)) {
      return avatar;
    }
    
    // Return FontAwesome icons based on personality
    const icons = {
      'professional': <i className="fas fa-briefcase text-sm"></i>,
      'friendly': <i className="fas fa-smile text-sm"></i>,
      'technical': <i className="fas fa-code text-sm"></i>,
      'creative': <i className="fas fa-palette text-sm"></i>,
      'manager': <i className="fas fa-crown text-sm"></i>,
      'student': <i className="fas fa-graduation-cap text-sm"></i>
    };
    
    return icons[personality as keyof typeof icons] || avatar.slice(0, 2);
  };

  return (
    <aside className="w-80 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 border-l border-purple-200/40 flex flex-col backdrop-blur-lg">
      
      {/* Enhanced Meeting Info Section */}
      <div className="p-6 border-b border-purple-200/30 bg-gradient-to-r from-white/80 via-purple-50/50 to-pink-50/30 backdrop-blur-sm relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          <div className="absolute top-0 left-1/4 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="flex items-center mb-4 relative">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg">
            <i className="fas fa-info-circle"></i>
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">بيانات الاجتماع</h2>
        </div>
        
        <div className="space-y-4 relative">
          <div>
            <span className="text-sm font-semibold text-purple-700 flex items-center mb-2">
              <i className="fas fa-tag ml-2 text-purple-600"></i>
              اسم الاجتماع:
            </span>
            <p className="text-sm text-gray-900 bg-gradient-to-r from-white/90 to-purple-50/60 p-3 rounded-lg backdrop-blur-sm border border-purple-100/30 shadow-sm font-medium">{meeting.name}</p>
          </div>
          <div>
            <span className="text-sm font-semibold text-purple-700 flex items-center mb-2">
              <i className="fas fa-briefcase ml-2 text-purple-600"></i>
              نوع الاجتماع:
            </span>
            <p className="text-sm text-gray-900 bg-gradient-to-r from-white/90 to-purple-50/60 p-3 rounded-lg backdrop-blur-sm border border-purple-100/30 shadow-sm font-medium">{meeting.type}</p>
          </div>
          
          {/* Enhanced Meeting Code Display */}
          <div>
            <span className="text-sm font-semibold text-purple-700 flex items-center mb-2">
              <i className="fas fa-key ml-2 text-purple-600"></i>
              رمز الاجتماع:
            </span>
            <div className="bg-gradient-to-r from-blue-100/80 to-purple-100/60 p-4 rounded-xl backdrop-blur-sm border border-blue-300/40 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/20 rounded-full blur-xl"></div>
              </div>
              <div className="relative">
                <div className="font-mono text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-wider text-center">
                  {(() => {
                    const hash = meeting.id.split('-')[0];
                    const numbers = hash.match(/\d/g) || [];
                    let code = numbers.join('').slice(0, 6);
                    if (code.length < 6) {
                      const chars = hash.replace(/[^a-f0-9]/g, '');
                      for (let i = 0; i < chars.length && code.length < 6; i++) {
                        const char = chars[i];
                        if (/[0-9]/.test(char)) {
                          code += char;
                        } else {
                          code += (parseInt(char, 16) % 10).toString();
                        }
                      }
                    }
                    return code.slice(0, 6);
                  })()}
                </div>
                <p className="text-xs text-blue-700/80 mt-2 text-center font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                  <i className="fas fa-share-alt ml-1"></i>
                  يمكن للآخرين الانضمام بهذا الرمز
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Meeting ID */}
          <div>
            <span className="text-sm font-semibold text-purple-700 flex items-center mb-2">
              <i className="fas fa-fingerprint ml-2 text-purple-600"></i>
              معرف الجلسة:
            </span>
            <div className="bg-gradient-to-r from-gray-100/80 to-purple-100/40 p-3 rounded-lg text-xs text-gray-700 font-mono break-all backdrop-blur-sm border border-gray-200/50 shadow-sm">
              {meeting.id}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-700 flex items-center">
              <i className="fas fa-signal ml-2 text-purple-600"></i>
              الحالة:
            </span>
            <span className="text-sm bg-gradient-to-r from-emerald-100/80 to-green-100/80 text-emerald-700 px-4 py-2 rounded-full flex items-center backdrop-blur-sm border border-emerald-300/40 shadow-sm font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full ml-2 animate-pulse shadow-lg shadow-emerald-500/50"></div>
              نشط ومتاح
            </span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Real Users Section */}
      {allRealUsers.length > 0 && (
        <div className="p-6 border-b border-purple-200/30 bg-gradient-to-r from-white/60 via-blue-50/40 to-purple-50/20 backdrop-blur-sm relative">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          </div>
          <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg">
              <i className="fas fa-users text-sm"></i>
            </div>
            المستخدمون الحقيقيون ({allRealUsers.length})
          </h3>
          <div className="space-y-3">
            {allRealUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-100/80 to-purple-100/60 border border-blue-200/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/20 rounded-full blur-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 bg-purple-500/20 rounded-full blur-lg"></div>
                </div>
                <div className="flex items-center space-x-reverse space-x-3 relative">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-xl text-sm">
                      {user.avatar}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm flex items-center bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                      {user.name}
                      {user.isHost && (
                        <span className="mr-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full shadow-lg">
                          <i className="fas fa-crown ml-1"></i>
                          مضيف
                        </span>
                      )}
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full backdrop-blur-sm border font-medium ${user.isOnline ? 'text-emerald-700 bg-emerald-100/80 border-emerald-300/40' : 'text-gray-600 bg-gray-100/80 border-gray-300/40'}`}>
                      <i className={`fas ${user.isOnline ? 'fa-circle text-emerald-500' : 'fa-circle text-gray-400'} ml-1 animate-pulse`}></i>
                      {user.isOnline ? 'متصل الآن' : 'غير متصل'}
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full shadow-lg ${user.isOnline ? 'bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Participants Management */}
      <div className="p-6 border-b border-purple-200/30 bg-gradient-to-r from-white/60 via-purple-50/40 to-pink-50/20 backdrop-blur-sm relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
          <div className="absolute top-0 left-1/3 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
        </div>
        <div className="flex justify-between items-center mb-4 relative">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg">
              <i className="fas fa-robot text-sm"></i>
            </div>
            <h3 className="font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">المشاركون الافتراضيون</h3>
          </div>
          <span className="text-xs text-purple-700 bg-gradient-to-r from-purple-100/80 to-pink-100/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-purple-300/40 shadow-sm font-medium">
            <i className="fas fa-users ml-1"></i>
            {participants.length} مشارك
          </span>
        </div>
        
        {/* Add Participant */}
        <div className="space-y-3 mb-4">
          <Input
            type="text"
            placeholder="اسم المشارك الجديد"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            className="text-sm"
          />
          
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="أو اختر من القوالب الجاهزة" />
            </SelectTrigger>
            <SelectContent>
              {arabicParticipantTemplates.map((template) => (
                <SelectItem key={template.name} value={template.name}>
                  {template.name} ({template.personality})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex space-x-reverse space-x-2">
            <Button
              onClick={addParticipant}
              disabled={!newParticipantName.trim() || addParticipantMutation.isPending}
              size="sm"
              className="flex-1 text-xs"
            >
              <i className="fas fa-plus ml-1"></i>
              إضافة مخصص
            </Button>
            <Button
              onClick={addTemplateParticipant}
              disabled={!selectedTemplate || addParticipantMutation.isPending}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              <i className="fas fa-user-plus ml-1"></i>
              إضافة قالب
            </Button>
          </div>
        </div>
        
        {/* Enhanced Participants List */}
        <div className="space-y-3">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center justify-between bg-gradient-to-r from-white/80 to-purple-50/60 p-4 rounded-xl backdrop-blur-sm border border-purple-100/30 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-6 h-6 bg-purple-500/20 rounded-full blur-lg"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-pink-500/20 rounded-full blur-lg"></div>
              </div>
              <div className="flex items-center relative">
                <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${getParticipantIconStyle(participant.personality, participant.avatar).replace('bg-gradient-to-br', '').replace('from-', 'from-').replace('to-', 'to-')} rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300`}></div>
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xl ${getParticipantIconStyle(participant.personality, participant.avatar)}`}>
                    {getParticipantIcon(participant.personality, participant.avatar)}
                  </div>
                </div>
                <span className="mr-3 text-sm font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">{participant.name}</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2 relative">
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm border transition-all duration-300 ${getStatusColor(participant.status).replace('bg-', 'bg-gradient-to-r from-').replace('text-', 'text-').replace(/bg-gradient-to-r from-([a-z-]+)-100/, 'bg-gradient-to-r from-$1-100/80 to-$1-50/60 border-$1-300/40')}`}>
                  <i className={`fas ${participant.status === 'active' ? 'fa-circle text-green-500' : participant.status === 'away' ? 'fa-clock text-yellow-500' : 'fa-circle text-gray-400'} ml-1 animate-pulse`}></i>
                  {getStatusText(participant.status)}
                </span>
                <Button
                  onClick={() => removeParticipant(participant.id)}
                  disabled={removeParticipantMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 h-8 w-8 p-0 rounded-full bg-gradient-to-r from-gray-100/80 to-red-100/40 hover:from-red-100/80 hover:to-red-200/60 backdrop-blur-sm border border-gray-200/50 hover:border-red-300/40 transition-all duration-300"
                >
                  <i className="fas fa-times text-xs"></i>
                </Button>
              </div>
            </div>
          ))}
          
          {participants.length === 0 && (
            <div className="text-center py-6 relative">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200/80 to-purple-200/60 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-lg relative">
                <i className="fas fa-users text-gray-500 text-lg"></i>
              </div>
              <p className="text-gray-700 text-sm font-semibold bg-gradient-to-r from-gray-700 to-purple-600 bg-clip-text text-transparent">لا يوجد مشاركون افتراضيون</p>
              <p className="text-purple-600/70 text-xs mt-2 font-medium">أضف مشاركين لبدء المحاكاة الذكية</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Quick Settings */}
      <div className="p-6 bg-gradient-to-r from-white/50 via-purple-50/30 to-pink-50/20 backdrop-blur-sm relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-purple-500/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="flex items-center mb-4 relative">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white mr-2 shadow-lg">
            <i className="fas fa-cog text-sm"></i>
          </div>
          <h3 className="font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">الإعدادات السريعة</h3>
        </div>
        
        <div className="space-y-4 relative">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-white/80 to-purple-50/60 rounded-lg backdrop-blur-sm border border-purple-100/30 shadow-sm">
            <span className="text-sm text-purple-700 font-medium flex items-center">
              <i className="fas fa-tachometer-alt ml-2 text-purple-600"></i>
              سرعة الرسائل
            </span>
            <Select 
              defaultValue={meeting.settings?.messageSpeed || 'medium'}
              onValueChange={(value) => {
                console.log('Message speed changed:', value);
                // Here you can add logic to update meeting settings
              }}
            >
              <SelectTrigger className="w-24 h-8 text-xs bg-gradient-to-r from-white to-purple-50 border border-purple-200/50 hover:border-purple-300/60 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">🐌 بطيء</SelectItem>
                <SelectItem value="medium">⚡ متوسط</SelectItem>
                <SelectItem value="fast">🚀 سريع</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-white/80 to-purple-50/60 rounded-lg backdrop-blur-sm border border-purple-100/30 shadow-sm">
            <span className="text-sm text-purple-700 font-medium flex items-center">
              <i className="fas fa-comments ml-2 text-purple-600"></i>
              نوع المحادثات
            </span>
            <Select 
              defaultValue={meeting.settings?.conversationType || 'friendly'}
              onValueChange={(value) => {
                console.log('Conversation type changed:', value);
                // Here you can add logic to update meeting settings
              }}
            >
              <SelectTrigger className="w-24 h-8 text-xs bg-gradient-to-r from-white to-purple-50 border border-purple-200/50 hover:border-purple-300/60 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">👔 رسمية</SelectItem>
                <SelectItem value="friendly">😊 ودية</SelectItem>
                <SelectItem value="technical">💻 تقنية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-white/80 to-purple-50/60 rounded-lg backdrop-blur-sm border border-purple-100/30 shadow-sm">
            <span className="text-sm text-purple-700 font-medium flex items-center">
              <i className="fas fa-volume-up ml-2 text-purple-600"></i>
              أصوات وهمية
            </span>
            <label htmlFor="autoSounds" className="relative cursor-pointer">
              <input 
                id="autoSounds"
                type="checkbox" 
                defaultChecked={meeting.settings?.autoSounds || false}
                className="sr-only peer"
                onChange={(e) => {
                  // Here you can add logic to update meeting settings
                  console.log('Auto sounds toggled:', e.target.checked);
                }}
              />
              <div className="w-11 h-6 bg-gradient-to-r from-gray-200 to-purple-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500 hover:shadow-md transition-shadow duration-200"></div>
            </label>
          </div>
        </div>
      </div>
      
    </aside>
  );
}
