import React, { useEffect, useState, useCallback } from 'react';
import { Users, Bot, MessageCircle, Zap, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { generateVirtualParticipants, VirtualParticipantAI, type VirtualParticipant } from '@/lib/virtual-participants-enhanced';

interface EnhancedVirtualParticipantsProps {
  meetingId: string;
  isActive: boolean;
  onParticipantsChange: (participants: VirtualParticipant[]) => void;
  onMessageGenerated: (message: { participant: VirtualParticipant; message: string; timestamp: Date }) => void;
  conversationTrigger?: string;
  settings?: {
    messageSpeed: 'slow' | 'medium' | 'fast';
    conversationType: 'formal' | 'friendly' | 'technical';
    autoSounds: boolean;
    virtualParticipantsEnabled: boolean;
    backgroundEffects: boolean;
    reactionAnimations: boolean;
  };
}

export default function EnhancedVirtualParticipants({ 
  meetingId, 
  isActive, 
  onParticipantsChange,
  onMessageGenerated,
  conversationTrigger = '',
  settings = {
    messageSpeed: 'medium',
    conversationType: 'friendly',
    autoSounds: false,
    virtualParticipantsEnabled: true,
    backgroundEffects: true,
    reactionAnimations: true
  }
}: EnhancedVirtualParticipantsProps) {
  const [participants, setParticipants] = useState<VirtualParticipant[]>([]);
  const [virtualAI, setVirtualAI] = useState<VirtualParticipantAI | null>(null);
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);
  const [participantCount, setParticipantCount] = useState(6);
  const [localSettings, setLocalSettings] = useState(settings);
  const [conversationActivity, setConversationActivity] = useState(0);
  const [lastTriggerTime, setLastTriggerTime] = useState(0);

  // Initialize virtual participants
  useEffect(() => {
    if (localSettings.virtualParticipantsEnabled && participants.length === 0) {
      initializeParticipants();
    }
  }, [localSettings.virtualParticipantsEnabled, participantCount]);

  // Initialize AI system
  useEffect(() => {
    if (participants.length > 0) {
      const ai = new VirtualParticipantAI(participants);
      setVirtualAI(ai);
      
      // Generate welcome messages when meeting starts
      if (isActive && !isGeneratingResponses) {
        setTimeout(() => {
          const welcomeMessages = ai.generateWelcomeMessages();
          welcomeMessages.forEach(({ participant, message, delay }) => {
            setTimeout(() => {
              onMessageGenerated({
                participant,
                message,
                timestamp: new Date()
              });
            }, delay);
          });
        }, 2000);
      }
    }
  }, [participants, isActive]);

  // Handle conversation triggers
  useEffect(() => {
    if (conversationTrigger && virtualAI && isActive && localSettings.virtualParticipantsEnabled) {
      const now = Date.now();
      // Prevent too frequent responses
      if (now - lastTriggerTime > 5000) {
        setLastTriggerTime(now);
        handleConversationTrigger(conversationTrigger);
      }
    }
  }, [conversationTrigger, virtualAI, isActive, localSettings.virtualParticipantsEnabled]);

  // Auto-conversation system
  useEffect(() => {
    if (!isActive || !localSettings.virtualParticipantsEnabled || !virtualAI) return;

    const interval = setInterval(() => {
      // Generate spontaneous conversations based on activity level
      if (Math.random() > 0.7) { // 30% chance every interval
        const spontaneousTopics = [
          'ما رأيكم في هذا الموضوع؟',
          'لدي اقتراح مهم',
          'دعونا نناقش النقطة التالية',
          'أتفق مع ما تم طرحه',
          'هذا يذكرني بتجربة سابقة',
          'ما الخطوات التالية؟',
          'نحتاج لمراجعة هذا الأمر'
        ];
        
        const topic = spontaneousTopics[Math.floor(Math.random() * spontaneousTopics.length)];
        handleConversationTrigger(topic);
      }
    }, getIntervalBySpeed(localSettings.messageSpeed));

    return () => clearInterval(interval);
  }, [isActive, localSettings.virtualParticipantsEnabled, virtualAI, localSettings.messageSpeed]);

  const initializeParticipants = useCallback(() => {
    const newParticipants = generateVirtualParticipants(participantCount);
    setParticipants(newParticipants);
    onParticipantsChange(newParticipants);
    setConversationActivity(0);
  }, [participantCount, onParticipantsChange]);

  const handleConversationTrigger = useCallback((trigger: string) => {
    if (!virtualAI || !isActive) return;

    setIsGeneratingResponses(true);
    
    const response = virtualAI.generateResponse(trigger, localSettings.messageSpeed);
    
    if (response) {
      // Add some randomness to make conversations more natural
      const actualDelay = response.delay + (Math.random() * 1000);
      
      setTimeout(() => {
        onMessageGenerated({
          participant: response.participant,
          message: response.message,
          timestamp: new Date()
        });
        
        setConversationActivity(prev => prev + 1);
        setIsGeneratingResponses(false);
        
        // Chain conversations - sometimes generate follow-up responses
        if (Math.random() > 0.6) {
          setTimeout(() => {
            const followUp = virtualAI.generateResponse(response.message, localSettings.messageSpeed);
            if (followUp && followUp.participant.id !== response.participant.id) {
              setTimeout(() => {
                onMessageGenerated({
                  participant: followUp.participant,
                  message: followUp.message,
                  timestamp: new Date()
                });
              }, followUp.delay);
            }
          }, 3000 + Math.random() * 2000);
        }
      }, actualDelay);
    } else {
      setIsGeneratingResponses(false);
    }
  }, [virtualAI, isActive, localSettings.messageSpeed, onMessageGenerated]);

  const getIntervalBySpeed = (speed: 'slow' | 'medium' | 'fast'): number => {
    switch (speed) {
      case 'fast': return 8000;  // 8 seconds
      case 'medium': return 15000; // 15 seconds  
      case 'slow': return 25000;  // 25 seconds
      default: return 15000;
    }
  };

  const toggleParticipantStatus = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, status: p.status === 'active' ? 'away' : 'active' }
        : p
    ));
    
    if (virtualAI) {
      const participant = participants.find(p => p.id === participantId);
      if (participant) {
        virtualAI.updateParticipantStatus(
          participantId, 
          participant.status === 'active' ? 'away' : 'active'
        );
      }
    }
  };

  const resetParticipants = () => {
    initializeParticipants();
    setConversationActivity(0);
  };

  const getPersonalityColor = (personality: string) => {
    const colors = {
      professional: 'bg-blue-500',
      friendly: 'bg-green-500', 
      technical: 'bg-purple-500',
      creative: 'bg-pink-500',
      manager: 'bg-orange-500'
    };
    return colors[personality as keyof typeof colors] || 'bg-gray-500';
  };

  const getPersonalityIcon = (personality: string) => {
    const icons = {
      professional: '👔',
      friendly: '😊',
      technical: '💻',
      creative: '🎨',
      manager: '📊'
    };
    return icons[personality as keyof typeof icons] || '👤';
  };

  if (!localSettings.virtualParticipantsEnabled) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg flex items-center">
            <Bot className="h-5 w-5 ml-2 text-gray-400" />
            المشاركون الافتراضيون
          </CardTitle>
          <CardDescription className="text-gray-400">
            المشاركون الافتراضيون معطلون حالياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              checked={false}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, virtualParticipantsEnabled: checked }))
              }
              data-testid="switch-enable-virtual-participants"
            />
            <span className="text-white text-sm">تفعيل المشاركين الافتراضيين</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg flex items-center">
                <Sparkles className="h-5 w-5 ml-2 text-purple-400" />
                مشاركون افتراضيون ذكيون
                {isGeneratingResponses && (
                  <div className="mr-2 animate-pulse">
                    <Zap className="h-4 w-4 text-yellow-400" />
                  </div>
                )}
              </CardTitle>
              <CardDescription className="text-purple-200">
                نشاط المحادثة: {conversationActivity} رسالة • {participants.filter(p => p.status === 'active').length} مشارك نشط
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
              AI مدعوم بـ
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">سرعة المحادثة</label>
              <Select
                value={localSettings.messageSpeed}
                onValueChange={(value: 'slow' | 'medium' | 'fast') =>
                  setLocalSettings(prev => ({ ...prev, messageSpeed: value }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-message-speed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">🐌 بطيء (كل 25 ثانية)</SelectItem>
                  <SelectItem value="medium">⚡ متوسط (كل 15 ثانية)</SelectItem>
                  <SelectItem value="fast">🚀 سريع (كل 8 ثوان)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">نمط المحادثة</label>
              <Select
                value={localSettings.conversationType}
                onValueChange={(value: 'formal' | 'friendly' | 'technical') =>
                  setLocalSettings(prev => ({ ...prev, conversationType: value }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-conversation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">🏢 رسمي</SelectItem>
                  <SelectItem value="friendly">😊 ودود</SelectItem>
                  <SelectItem value="technical">🔧 تقني</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">عدد المشاركين: {participantCount}</label>
              <Slider
                value={[participantCount]}
                onValueChange={(value) => setParticipantCount(value[0])}
                max={12}
                min={3}
                step={1}
                className="w-full"
                data-testid="slider-participant-count"
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={resetParticipants}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              data-testid="button-reset-participants"
            >
              <RotateCcw className="h-4 w-4 ml-1" />
              إعادة تشكيل
            </Button>

            <Button
              onClick={() => setLocalSettings(prev => ({ ...prev, reactionAnimations: !prev.reactionAnimations }))}
              variant="outline"
              size="sm"
              className={`border-white/20 text-white hover:bg-white/20 ${
                localSettings.reactionAnimations ? 'bg-purple-500/30' : 'bg-white/10'
              }`}
              data-testid="button-toggle-animations"
            >
              <Sparkles className="h-4 w-4 ml-1" />
              تفاعلات متحركة
            </Button>

            <Button
              onClick={() => setLocalSettings(prev => ({ ...prev, autoSounds: !prev.autoSounds }))}
              variant="outline"
              size="sm"
              className={`border-white/20 text-white hover:bg-white/20 ${
                localSettings.autoSounds ? 'bg-green-500/30' : 'bg-white/10'
              }`}
              data-testid="button-toggle-sounds"
            >
              {localSettings.autoSounds ? <Play className="h-4 w-4 ml-1" /> : <Pause className="h-4 w-4 ml-1" />}
              أصوات تلقائية
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Participants Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`relative p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                  participant.status === 'active'
                    ? 'bg-white/10 border-green-400/30 shadow-sm shadow-green-400/20'
                    : participant.status === 'away'
                    ? 'bg-white/5 border-yellow-400/30 shadow-sm shadow-yellow-400/20'
                    : 'bg-white/3 border-red-400/30 shadow-sm shadow-red-400/20'
                }`}
                onClick={() => toggleParticipantStatus(participant.id)}
                data-testid={`participant-${participant.id}`}
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    getPersonalityColor(participant.personality)
                  }`}>
                    {getPersonalityIcon(participant.personality)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {participant.name}
                    </p>
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <div className={`w-2 h-2 rounded-full ${
                        participant.status === 'active' ? 'bg-green-400' :
                        participant.status === 'away' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="text-xs text-gray-300">
                        {participant.status === 'active' ? 'نشط' : 
                         participant.status === 'away' ? 'بعيد' : 'غير متصل'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personality Badge */}
                <Badge
                  variant="secondary"
                  className="absolute top-1 left-1 text-xs bg-black/30 text-white border-0"
                >
                  {participant.personality === 'professional' && '👔 مهني'}
                  {participant.personality === 'friendly' && '😊 ودود'}
                  {participant.personality === 'technical' && '💻 تقني'}
                  {participant.personality === 'creative' && '🎨 مبدع'}
                  {participant.personality === 'manager' && '📊 مدير'}
                </Badge>

                {/* Activity Indicator */}
                {isGeneratingResponses && (
                  <div className="absolute bottom-1 right-1">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Activity Status */}
          <div className="bg-black/20 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-200">حالة النشاط:</span>
              <span className="text-white">
                {isGeneratingResponses ? '🤖 جاري التفكير...' : '💭 في انتظار المحفزات'}
              </span>
            </div>
            {virtualAI && (
              <div className="mt-2 text-xs text-gray-400">
                آخر نشاط: {virtualAI.getConversationSummary() || 'لا توجد محادثة بعد'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}