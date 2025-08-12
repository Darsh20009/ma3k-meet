export interface VirtualParticipantTemplate {
  name: string;
  avatar: string;
  personality: 'professional' | 'friendly' | 'technical';
  messagePatterns: string[];
}

export const arabicParticipantTemplates: VirtualParticipantTemplate[] = [
  {
    name: 'أحمد محمد',
    avatar: 'أح',
    personality: 'professional',
    messagePatterns: [
      'مرحباً بالجميع، أعتقد أننا جاهزون للبدء',
      'هل يمكننا مراجعة النقاط الأساسية؟',
      'بالطبع، سأشارك الشاشة الآن',
      'أعتقد أن هذا الحل مناسب للمشكلة',
      'دعنا نناقش التفاصيل أكثر',
      'هل لديكم أي استفسارات حول هذا الموضوع؟'
    ]
  },
  {
    name: 'فاطمة أحمد',
    avatar: 'فا',
    personality: 'friendly',
    messagePatterns: [
      'موافقة، لدي بعض الملاحظات',
      'ممتاز! أرى التحسينات واضحة',
      'هل يمكننا مناقشة النقطة الثالثة بالتفصيل؟',
      'شكراً لك على التوضيح',
      'أعتقد أن هذا اتجاه صحيح',
      'هل يمكنني إضافة نقطة مهمة؟'
    ]
  },
  {
    name: 'علي حسن',
    avatar: 'عل',
    personality: 'technical',
    messagePatterns: [
      'هل يمكننا مراجعة الجدولة الزمنية؟',
      'شكراً لك على التوضيح، هذا يساعدني كثيراً',
      'موافق، أنا متابع معكم',
      'هل هناك متطلبات تقنية إضافية؟',
      'أعتقد أننا نحتاج لمزيد من التحليل',
      'هل تم اختبار هذا الحل مسبقاً؟'
    ]
  },
  {
    name: 'سارة يوسف',
    avatar: 'سا',
    personality: 'professional',
    messagePatterns: [
      'أوافق على هذا الاقتراح',
      'دعنا نضع خطة زمنية واضحة',
      'هل يمكننا تحديد المسؤوليات؟',
      'أعتقد أن هذا سيحسن من الأداء',
      'نحتاج لتقييم المخاطر المحتملة',
      'هل لديكم بيانات تدعم هذا القرار؟'
    ]
  },
  {
    name: 'محمد خالد',
    avatar: 'مح',
    personality: 'friendly',
    messagePatterns: [
      'فكرة رائعة، أؤيدها بقوة',
      'هل يمكننا إضافة هذه النقطة للمتابعة؟',
      'أعتقد أن الفريق يقوم بعمل ممتاز',
      'دعونا نحتفل بهذا الإنجاز',
      'أشكركم على جهودكم المميزة',
      'هل هناك شيء يمكنني مساعدتكم فيه؟'
    ]
  }
];

export function generateRandomMessage(participant: VirtualParticipantTemplate, context?: string): string {
  const messages = participant.messagePatterns;
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getMessageDelay(speed: 'slow' | 'medium' | 'fast'): number {
  const baseDelay = {
    slow: 15000,
    medium: 8000,
    fast: 4000
  };
  
  const randomVariation = Math.random() * 5000; // Add up to 5 seconds variation
  return baseDelay[speed] + randomVariation;
}

export const systemMessages = [
  'بدأ الاجتماع',
  'انضم {name} للاجتماع',
  'غادر {name} الاجتماع',
  '{name} يشارك الشاشة',
  'توقف {name} عن مشاركة الشاشة',
  'تم كتم صوت {name}',
  'تم إلغاء كتم صوت {name}'
];
