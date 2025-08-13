import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Plus, Key, Users, Sparkles, Video, Lock, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import MeetingCreationForm from '@/components/meeting-creation-form';
import MeetingSecurity from './meeting-security';

export default function SecureMeetingHome() {
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleMeetingCreated = (meeting: any) => {
    setLocation(`/meeting/${meeting.id}`);
  };

  const handleAccessGranted = (meetingId: string) => {
    setLocation(`/meeting/${meetingId}`);
  };

  if (showCreateForm) {
    return (
      <MeetingCreationForm
        onMeetingCreated={handleMeetingCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (showJoinForm) {
    return (
      <MeetingSecurity
        onAccessGranted={handleAccessGranted}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-purple-400/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-from)_0%,_transparent_50%)] from-blue-400/20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-6 shadow-2xl">
            <Video className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            معك ميتيجس
            <span className="block text-2xl font-normal text-purple-200 mt-2">
              اجتماعات آمنة ومحمية مع ذكاء اصطناعي
            </span>
          </h1>
          
          <div className="flex justify-center gap-2 mb-8">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-300/30">
              <Shield className="h-3 w-3 ml-1" />
              حماية متقدمة
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-300/30">
              <Sparkles className="h-3 w-3 ml-1" />
              مشاركون ذكيون
            </Badge>
            <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-300/30">
              <Zap className="h-3 w-3 ml-1" />
              عالي الأداء
            </Badge>
          </div>
        </div>

        {/* Main Actions */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* Create Meeting Card */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 group">
            <CardHeader className="pb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                إنشاء اجتماع جديد
              </CardTitle>
              <CardDescription className="text-purple-200 text-lg">
                ابدأ اجتماع آمن مع إعدادات متقدمة ومشاركين افتراضيين ذكيين
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-purple-200">
                  <Shield className="h-4 w-4 ml-2 text-green-400" />
                  حماية بكلمة مرور اختيارية
                </div>
                <div className="flex items-center text-sm text-purple-200">
                  <Users className="h-4 w-4 ml-2 text-blue-400" />
                  مشاركون افتراضيون بذكاء اصطناعي
                </div>
                <div className="flex items-center text-sm text-purple-200">
                  <Video className="h-4 w-4 ml-2 text-purple-400" />
                  مشاركة شاشة ومحادثة نصية
                </div>
                <div className="flex items-center text-sm text-purple-200">
                  <Lock className="h-4 w-4 ml-2 text-orange-400" />
                  غرفة انتظار وتحكم بالمشاركين
                </div>
              </div>
              
              <Separator className="bg-white/20" />
              
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-create-meeting"
              >
                <Plus className="h-5 w-5 ml-2" />
                إنشاء الاجتماع الآن
              </Button>
            </CardContent>
          </Card>

          {/* Join Meeting Card */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group">
            <CardHeader className="pb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Key className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                انضمام لاجتماع
              </CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                ادخل كود الاجتماع المكون من 6 أرقام للانضمام الآمن
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-blue-200">
                  <Shield className="h-4 w-4 ml-2 text-green-400" />
                  تشفير الاتصال وحماية البيانات
                </div>
                <div className="flex items-center text-sm text-blue-200">
                  <Key className="h-4 w-4 ml-2 text-yellow-400" />
                  دعم كلمات المرور الإضافية
                </div>
                <div className="flex items-center text-sm text-blue-200">
                  <Users className="h-4 w-4 ml-2 text-purple-400" />
                  تفاعل مع المشاركين الحقيقيين والافتراضيين
                </div>
                <div className="flex items-center text-sm text-blue-200">
                  <Sparkles className="h-4 w-4 ml-2 text-pink-400" />
                  تجربة اجتماع متقدمة وسلسة
                </div>
              </div>
              
              <Separator className="bg-white/20" />
              
              <Button
                onClick={() => setShowJoinForm(true)}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-join-meeting"
              >
                <Key className="h-5 w-5 ml-2" />
                انضمام بالكود
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            مميزات متقدمة تتفوق على Zoom وGoogle Meet
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-white">مشاركون ذكيون</CardTitle>
                <CardDescription className="text-purple-200">
                  مشاركون افتراضيون بذكاء اصطناعي يتفاعلون بطبيعية ويثرون النقاش
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <CardTitle className="text-white">أمان متقدم</CardTitle>
                <CardDescription className="text-green-200">
                  حماية بكلمات مرور، غرف انتظار، وتحكم كامل في المشاركين
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Video className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-white">تجربة سلسة</CardTitle>
                <CardDescription className="text-blue-200">
                  واجهة عربية متقدمة مع تأثيرات بصرية وتفاعلات متحركة
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-purple-300 text-lg mb-4">
            تجربة اجتماعات افتراضية متطورة مع الذكاء الاصطناعي
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/welcome')}
              className="text-purple-200 hover:text-white hover:bg-white/10"
              data-testid="button-back-welcome"
            >
              العودة للترحيب
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}