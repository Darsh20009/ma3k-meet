import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Lock, Users, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MeetingSecurityProps {
  meetingCode?: string;
  onAccessGranted: (meetingId: string) => void;
}

export default function MeetingSecurity({ meetingCode: initialCode, onAccessGranted }: MeetingSecurityProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    meetingCode: initialCode || '',
    password: '',
    userName: localStorage.getItem('userName') || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/meetings/join', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          setRequiresPassword(true);
          toast({
            title: "كلمة المرور مطلوبة",
            description: "هذا الاجتماع محمي بكلمة مرور",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.error || 'Failed to join meeting');
      }

      const result = await response.json();
      
      // Save user name for future use
      localStorage.setItem('userName', formData.userName);
      
      toast({
        title: "تم الدخول بنجاح! 🎉",
        description: `مرحباً بك في ${result.meeting.name}`,
      });
      
      onAccessGranted(result.meeting.id);
      
    } catch (error) {
      toast({
        title: "فشل في الدخول",
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-purple-400/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-from)_0%,_transparent_50%)] from-blue-400/20"></div>
      
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            دخول آمن للاجتماع
          </CardTitle>
          <CardDescription className="text-purple-200">
            أدخل كود الاجتماع وبياناتك للانضمام
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleJoinMeeting}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meetingCode" className="text-white text-right block">
                كود الاجتماع (6 أرقام)
              </Label>
              <div className="relative">
                <Input
                  id="meetingCode"
                  type="text"
                  placeholder="123456"
                  value={formData.meetingCode}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    meetingCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  required
                  data-testid="input-meeting-code"
                />
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName" className="text-white text-right block">
                اسمك
              </Label>
              <Input
                id="userName"
                type="text"
                placeholder="أدخل اسمك"
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 text-right"
                required
                data-testid="input-user-name"
              />
            </div>

            {requiresPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-right block">
                  كلمة مرور الاجتماع
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 text-right pr-10"
                    required={requiresPassword}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-purple-300" />
                    ) : (
                      <Eye className="h-4 w-4 text-purple-300" />
                    )}
                  </Button>
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              disabled={isLoading || !formData.meetingCode || !formData.userName}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-join-meeting"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>جارِ التحقق...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <span>انضمام للاجتماع</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLocation('/')}
              className="w-full text-purple-200 hover:text-white hover:bg-white/10"
              data-testid="button-back-home"
            >
              العودة للصفحة الرئيسية
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}