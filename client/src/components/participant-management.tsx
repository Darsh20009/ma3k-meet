import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { arabicParticipantTemplates } from "@/lib/virtual-participants";
import type { Meeting, VirtualParticipant } from "@shared/schema";

interface ParticipantManagementProps {
  meeting: Meeting;
  showParticipants: boolean;
}

export default function ParticipantManagement({ meeting, showParticipants }: ParticipantManagementProps) {
  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery<VirtualParticipant[]>({
    queryKey: ['/api/meetings', meeting.id, 'participants'],
  });

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
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      
      {/* Meeting Creation Section */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">معلومات الاجتماع</h2>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">اسم الاجتماع:</span>
            <p className="text-sm text-gray-900 mt-1">{meeting.name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">نوع الاجتماع:</span>
            <p className="text-sm text-gray-900 mt-1">{meeting.type}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">الحالة:</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              نشط
            </span>
          </div>
        </div>
      </div>
      
      {/* Participants Management */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">المشاركون الافتراضيون</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
        
        {/* Participants List */}
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getParticipantIconStyle(participant.personality, participant.avatar)}`}>
                  {getParticipantIcon(participant.personality, participant.avatar)}
                </div>
                <span className="mr-2 text-sm font-medium">{participant.name}</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-1">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(participant.status)}`}>
                  {getStatusText(participant.status)}
                </span>
                <Button
                  onClick={() => removeParticipant(participant.id)}
                  disabled={removeParticipantMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                >
                  <i className="fas fa-times text-xs"></i>
                </Button>
              </div>
            </div>
          ))}
          
          {participants.length === 0 && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-users text-gray-400"></i>
              </div>
              <p className="text-gray-600 text-sm">لا يوجد مشاركون افتراضيون</p>
              <p className="text-gray-500 text-xs mt-1">أضف مشاركين لبدء المحاكاة</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Settings */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">الإعدادات السريعة</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">سرعة الرسائل</span>
            <Select defaultValue={meeting.settings?.messageSpeed || 'medium'}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">بطيء</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="fast">سريع</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">نوع المحادثات</span>
            <Select defaultValue={meeting.settings?.conversationType || 'friendly'}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">رسمية</SelectItem>
                <SelectItem value="friendly">ودية</SelectItem>
                <SelectItem value="technical">تقنية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">أصوات وهمية</span>
            <div className="relative">
              <input 
                type="checkbox" 
                defaultChecked={meeting.settings?.autoSounds || false}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </div>
        </div>
      </div>
      
    </aside>
  );
}
