import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Lock, Camera, Mic, Monitor, MessageCircle, Clock, Video, Settings, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const meetingSchema = z.object({
  name: z.string().min(1, 'اسم الاجتماع مطلوب'),
  type: z.string(),
  password: z.string().optional(),
  isPasswordProtected: z.boolean(),
  maxParticipants: z.number().min(2).max(1000),
  waitingRoom: z.boolean(),
  recordMeeting: z.boolean(),
  allowScreenShare: z.boolean(),
  allowChat: z.boolean(),
  muteOnJoin: z.boolean(),
  settings: z.object({
    messageSpeed: z.enum(['slow', 'medium', 'fast']),
    conversationType: z.enum(['formal', 'friendly', 'technical']),
    autoSounds: z.boolean(),
    virtualParticipantsEnabled: z.boolean(),
    backgroundEffects: z.boolean(),
    reactionAnimations: z.boolean(),
  })
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingCreationFormProps {
  onMeetingCreated: (meeting: any) => void;
  onCancel: () => void;
}

export default function MeetingCreationForm({ onMeetingCreated, onCancel }: MeetingCreationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      name: '',
      type: 'اجتماع عمل',
      password: '',
      isPasswordProtected: false,
      maxParticipants: 100,
      waitingRoom: false,
      recordMeeting: false,
      allowScreenShare: true,
      allowChat: true,
      muteOnJoin: false,
      settings: {
        messageSpeed: 'medium',
        conversationType: 'friendly',
        autoSounds: false,
        virtualParticipantsEnabled: true,
        backgroundEffects: true,
        reactionAnimations: true,
      }
    }
  });

  const isPasswordProtected = form.watch('isPasswordProtected');

  const onSubmit = async (data: MeetingFormData) => {
    try {
      setIsLoading(true);
      
      const meetingData = {
        ...data,
        hostId: localStorage.getItem('userId') || 'anonymous-user',
        password: data.isPasswordProtected ? data.password : undefined,
      };

      const response = await apiRequest('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const meeting = await response.json();
      
      toast({
        title: "تم إنشاء الاجتماع بنجاح! 🎉",
        description: `كود الاجتماع: ${meeting.meetingCode}`,
      });

      onMeetingCreated(meeting);
      
    } catch (error) {
      toast({
        title: "فشل في إنشاء الاجتماع",
        description: "حدث خطأ غير متوقع، حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Video className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            إنشاء اجتماع جديد
          </CardTitle>
          <CardDescription className="text-purple-200 text-lg">
            اختر إعدادات الاجتماع والأمان حسب احتياجاتك
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Settings className="h-5 w-5 ml-2" />
                  المعلومات الأساسية
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">اسم الاجتماع</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: اجتماع فريق التطوير"
                            {...field} 
                            className="bg-white/10 border-white/20 text-white placeholder:text-purple-200"
                            data-testid="input-meeting-name"
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">نوع الاجتماع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-meeting-type">
                              <SelectValue placeholder="اختر نوع الاجتماع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="اجتماع عمل">اجتماع عمل</SelectItem>
                            <SelectItem value="جلسة دراسية">جلسة دراسية</SelectItem>
                            <SelectItem value="مراجعة مشروع">مراجعة مشروع</SelectItem>
                            <SelectItem value="عصف ذهني">عصف ذهني</SelectItem>
                            <SelectItem value="اجتماع عائلي">اجتماع عائلي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Shield className="h-5 w-5 ml-2" />
                  إعدادات الأمان
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isPasswordProtected"
                    render={({ field }) => (
                      <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-white flex items-center">
                              <Lock className="h-4 w-4 ml-2" />
                              حماية بكلمة مرور
                            </FormLabel>
                            <FormDescription className="text-purple-200">
                              إضافة كلمة مرور للاجتماع
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-password-protection"
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waitingRoom"
                    render={({ field }) => (
                      <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-white flex items-center">
                              <Users className="h-4 w-4 ml-2" />
                              غرفة الانتظار
                            </FormLabel>
                            <FormDescription className="text-purple-200">
                              الموافقة على دخول المشاركين
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-waiting-room"
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {isPasswordProtected && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">كلمة المرور</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="أدخل كلمة مرور قوية"
                            {...field}
                            className="bg-white/10 border-white/20 text-white placeholder:text-purple-200"
                            data-testid="input-meeting-password"
                          />
                        </FormControl>
                        <FormDescription className="text-purple-300">
                          ستحتاج لمشاركة هذه الكلمة مع المشاركين
                        </FormDescription>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator className="bg-white/20" />

              {/* Capacity Settings */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-5 w-5 ml-2" />
                  سعة الاجتماع
                </h3>
                
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">العدد الأقصى للمشاركين</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2"
                          max="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                          className="bg-white/10 border-white/20 text-white w-32"
                          data-testid="input-max-participants"
                        />
                      </FormControl>
                      <FormDescription className="text-purple-300">
                        يمكن تعديل هذا الرقم لاحقاً
                      </FormDescription>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Advanced Settings Toggle */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-purple-200 hover:text-white hover:bg-white/10"
                  data-testid="button-toggle-advanced"
                >
                  <Settings className="h-4 w-4 ml-2" />
                  {showAdvanced ? 'إخفاء الإعدادات المتقدمة' : 'إعدادات متقدمة'}
                </Button>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <>
                  <Separator className="bg-white/20" />
                  
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <Sparkles className="h-5 w-5 ml-2" />
                      الإعدادات المتقدمة
                    </h3>
                    
                    {/* Meeting Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="allowScreenShare"
                        render={({ field }) => (
                          <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <FormLabel className="text-white flex items-center">
                                  <Monitor className="h-4 w-4 ml-2" />
                                  مشاركة الشاشة
                                </FormLabel>
                                <FormDescription className="text-purple-200">
                                  السماح بمشاركة الشاشة
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-screen-share"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowChat"
                        render={({ field }) => (
                          <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <FormLabel className="text-white flex items-center">
                                  <MessageCircle className="h-4 w-4 ml-2" />
                                  الدردشة
                                </FormLabel>
                                <FormDescription className="text-purple-200">
                                  السماح بالدردشة النصية
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-chat"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="muteOnJoin"
                        render={({ field }) => (
                          <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <FormLabel className="text-white flex items-center">
                                  <Mic className="h-4 w-4 ml-2" />
                                  كتم عند الدخول
                                </FormLabel>
                                <FormDescription className="text-purple-200">
                                  كتم المشاركين عند الانضمام
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-mute-on-join"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recordMeeting"
                        render={({ field }) => (
                          <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <FormLabel className="text-white flex items-center">
                                  <Camera className="h-4 w-4 ml-2" />
                                  تسجيل الاجتماع
                                </FormLabel>
                                <FormDescription className="text-purple-200">
                                  تسجيل الاجتماع تلقائياً
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-recording"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Virtual Participants Settings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">إعدادات المشاركين الافتراضيين</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="settings.virtualParticipantsEnabled"
                          render={({ field }) => (
                            <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <FormLabel className="text-white">مشاركين افتراضيين</FormLabel>
                                  <FormDescription className="text-purple-200">
                                    إضافة مشاركين ذكيين تلقائياً
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-virtual-participants"
                                  />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="settings.messageSpeed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">سرعة الرسائل</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-message-speed">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="slow">بطيء</SelectItem>
                                  <SelectItem value="medium">متوسط</SelectItem>
                                  <SelectItem value="fast">سريع</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="settings.conversationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">نوع المحادثة</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-conversation-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="formal">رسمية</SelectItem>
                                  <SelectItem value="friendly">ودية</SelectItem>
                                  <SelectItem value="technical">تقنية</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="settings.reactionAnimations"
                          render={({ field }) => (
                            <FormItem className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <FormLabel className="text-white">تفاعلات متحركة</FormLabel>
                                  <FormDescription className="text-purple-200">
                                    رسوم متحركة للتفاعلات
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-reaction-animations"
                                  />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-create-meeting"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>جاري الإنشاء...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <Video className="h-5 w-5" />
                      <span>إنشاء الاجتماع</span>
                    </div>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="flex-1 text-purple-200 hover:text-white hover:bg-white/10 py-3 px-6"
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}