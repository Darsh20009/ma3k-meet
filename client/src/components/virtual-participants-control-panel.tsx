import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { VirtualParticipant } from '@shared/schema';
import { Users, Settings, Volume2, MessageCircle, Bot, Zap, Play, Pause, RotateCcw, Eye } from 'lucide-react';

interface VirtualParticipantsControlPanelProps {
  participants: VirtualParticipant[];
  onToggleParticipant: (participantId: string, isActive: boolean) => void;
  onUpdateSettings: (settings: VirtualParticipantSettings) => void;
  onGenerateMessage: (participantId: string) => void;
  onResetBehavior: () => void;
}

export interface VirtualParticipantSettings {
  enabled: boolean;
  activityLevel: number; // 0-100
  chattiness: number; // 0-100  
  speakingFrequency: number; // 0-100
  reactionLevel: number; // 0-100
  conversationMode: 'natural' | 'professional' | 'creative' | 'technical';
  autoResponses: boolean;
  backgroundActivity: boolean;
  realisticBehavior: boolean;
}

const defaultSettings: VirtualParticipantSettings = {
  enabled: true,
  activityLevel: 70,
  chattiness: 60,
  speakingFrequency: 40,
  reactionLevel: 80,
  conversationMode: 'natural',
  autoResponses: true,
  backgroundActivity: true,
  realisticBehavior: true
};

export default function VirtualParticipantsControlPanel({
  participants,
  onToggleParticipant,
  onUpdateSettings,
  onGenerateMessage,
  onResetBehavior
}: VirtualParticipantsControlPanelProps) {
  const [settings, setSettings] = useState<VirtualParticipantSettings>(defaultSettings);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onUpdateSettings(settings);
  }, [settings, onUpdateSettings]);

  const handleSettingChange = (key: keyof VirtualParticipantSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'professional': return '💼';
      case 'creative': return '🎨';
      case 'technical': return '⚡';
      case 'manager': return '👑';
      case 'friendly': return '😊';
      default: return '👤';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'away': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/90 via-purple-900/50 to-slate-800/90 backdrop-blur-lg border border-purple-700/40 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-lg font-bold">المشاركون الافتراضيون</CardTitle>
              <CardDescription className="text-purple-200 text-sm">
                {participants.length} مشارك نشط
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-300 hover:text-white hover:bg-purple-700/30"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-800/30 to-pink-800/30 rounded-lg border border-purple-600/30">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-purple-300" />
            <span className="text-white font-medium">تفعيل المشاركين الافتراضيين</span>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => handleSettingChange('enabled', enabled)}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        {settings.enabled && (
          <>
            {/* Participants List */}
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm flex items-center">
                <Users className="w-4 h-4 ml-2 text-purple-300" />
                قائمة المشاركين
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-600/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{participant.avatar}</div>
                      <div>
                        <div className="text-white font-medium text-sm">{participant.name}</div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(participant.status)}`}>
                            {participant.status === 'active' ? 'نشط' : 'بعيد'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {getPersonalityIcon(participant.personality)} {participant.personality}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onGenerateMessage(participant.id)}
                        className="text-blue-300 hover:text-white hover:bg-blue-700/30 w-8 h-8 p-0"
                        title="إرسال رسالة"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Switch
                        checked={participant.status === 'active'}
                        onCheckedChange={(isActive) => onToggleParticipant(participant.id, isActive)}
                        className="data-[state=checked]:bg-green-600 scale-75"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                onClick={onResetBehavior}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
              >
                <RotateCcw className="w-4 h-4 ml-2" />
                إعادة تعيين السلوك
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-purple-300">مستوى النشاط</span>
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${settings.activityLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings (Expandable) */}
            {isExpanded && (
              <>
                <Separator className="bg-purple-700/30" />
                <div className="space-y-4">
                  <h4 className="text-white font-semibold text-sm">إعدادات متقدمة</h4>
                  
                  {/* Activity Level */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-purple-200">مستوى النشاط</label>
                      <span className="text-xs text-purple-300">{settings.activityLevel}%</span>
                    </div>
                    <Slider
                      value={[settings.activityLevel]}
                      onValueChange={([value]) => handleSettingChange('activityLevel', value)}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Chattiness */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-purple-200">مستوى المحادثة</label>
                      <span className="text-xs text-purple-300">{settings.chattiness}%</span>
                    </div>
                    <Slider
                      value={[settings.chattiness]}
                      onValueChange={([value]) => handleSettingChange('chattiness', value)}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Speaking Frequency */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-purple-200">تكرار التحدث</label>
                      <span className="text-xs text-purple-300">{settings.speakingFrequency}%</span>
                    </div>
                    <Slider
                      value={[settings.speakingFrequency]}
                      onValueChange={([value]) => handleSettingChange('speakingFrequency', value)}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Conversation Mode */}
                  <div className="space-y-2">
                    <label className="text-sm text-purple-200">نمط المحادثة</label>
                    <Select
                      value={settings.conversationMode}
                      onValueChange={(value) => handleSettingChange('conversationMode', value)}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="natural">طبيعي</SelectItem>
                        <SelectItem value="professional">مهني</SelectItem>
                        <SelectItem value="creative">إبداعي</SelectItem>
                        <SelectItem value="technical">تقني</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Feature Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-200">الردود التلقائية</span>
                      <Switch
                        checked={settings.autoResponses}
                        onCheckedChange={(checked) => handleSettingChange('autoResponses', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-200">النشاط في الخلفية</span>
                      <Switch
                        checked={settings.backgroundActivity}
                        onCheckedChange={(checked) => handleSettingChange('backgroundActivity', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-200">السلوك الواقعي</span>
                      <Switch
                        checked={settings.realisticBehavior}
                        onCheckedChange={(checked) => handleSettingChange('realisticBehavior', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}