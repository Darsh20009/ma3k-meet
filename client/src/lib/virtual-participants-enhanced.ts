// Enhanced Virtual Participants with Arabic AI-like responses
import { nanoid } from 'nanoid';

export interface VirtualParticipant {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'away' | 'offline';
  personality: 'professional' | 'friendly' | 'technical' | 'creative' | 'manager';
  joinTime?: Date;
  lastMessageTime?: Date;
}

export interface MessagePattern {
  triggers: string[];
  responses: string[];
  delay: number; // milliseconds
  priority: number;
}

// Enhanced Arabic message patterns for different personalities
const MESSAGE_PATTERNS: Record<string, MessagePattern[]> = {
  professional: [
    {
      triggers: ['مرحبا', 'أهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير'],
      responses: [
        'مرحباً بالجميع، سعيد بالمشاركة في هذا الاجتماع المهم',
        'أهلاً وسهلاً، أتطلع للمناقشة الفعالة اليوم',
        'السلام عليكم ورحمة الله، جاهز للبدء',
        'صباح الخير، دعونا نبدأ بمناقشة النقاط الرئيسية'
      ],
      delay: 2000,
      priority: 1
    },
    {
      triggers: ['المشروع', 'التطوير', 'العمل', 'المهمة'],
      responses: [
        'بالنسبة للمشروع، أعتقد أننا بحاجة لتحديد الأولويات',
        'يمكننا تقسيم العمل إلى مراحل قابلة للتنفيذ',
        'لدي بعض الاقتراحات لتحسين سير العمل',
        'ما رأيكم في وضع جدول زمني واضح للمهام؟'
      ],
      delay: 3000,
      priority: 2
    }
  ],
  friendly: [
    {
      triggers: ['مرحبا', 'أهلا', 'هاي', 'كيفك'],
      responses: [
        'مرحبا حبيبي! كيف الأحوال؟ 😊',
        'أهلاً أهلاً! نورت الاجتماع',
        'هاااي! وحشتوني، كيفكم اليوم؟',
        'أهلين! شلونكم؟ إن شاء الله تمام'
      ],
      delay: 1500,
      priority: 1
    },
    {
      triggers: ['شكرا', 'ممتاز', 'رائع', 'جميل'],
      responses: [
        'عفواً حبيبي، هذا أقل واجب! ❤️',
        'الله يعطيك العافية! أنت الأروع',
        'ما شاء الله عليك، دايماً مبدع',
        'هذا من ذوقك الحلو! 🌟'
      ],
      delay: 2000,
      priority: 2
    }
  ],
  technical: [
    {
      triggers: ['كود', 'برمجة', 'تقنية', 'API', 'database', 'سيرفر'],
      responses: [
        'بالنسبة للكود، أقترح استخدام TypeScript لضمان type safety',
        'يمكننا تحسين الأداء باستخدام caching mechanisms',
        'ما رأيكم في تطبيق Clean Architecture patterns؟',
        'نحتاج لمراجعة الـ API design patterns المستخدمة'
      ],
      delay: 4000,
      priority: 2
    },
    {
      triggers: ['مشكلة', 'خطأ', 'bug', 'error'],
      responses: [
        'دعني أحلل الكود لأجد السبب في المشكلة',
        'يبدو أن هناك memory leak في الـ application',
        'المشكلة قد تكون في الـ database connection pool',
        'أعتقد أن الحل في تحسين exception handling'
      ],
      delay: 5000,
      priority: 3
    }
  ],
  creative: [
    {
      triggers: ['تصميم', 'فكرة', 'إبداع', 'UI', 'UX', 'ألوان'],
      responses: [
        'لدي فكرة إبداعية! ما رأيكم في gradient backgrounds مع glassmorphism؟',
        'يمكننا إضافة micro-animations لتحسين user experience',
        'أقترح استخدام color psychology في تصميم الواجهة',
        'دعونا نفكر في innovative interaction patterns! 🎨'
      ],
      delay: 3000,
      priority: 2
    },
    {
      triggers: ['مستخدم', 'تجربة', 'واجهة', 'تفاعل'],
      responses: [
        'التجربة يجب أن تكون intuitive و engaging للمستخدمين',
        'ما رأيكم في إضافة accessibility features؟',
        'يمكننا عمل A/B testing لقياس effectiveness التصميم',
        'أحب فكرة personalized user journeys! ✨'
      ],
      delay: 3500,
      priority: 2
    }
  ],
  manager: [
    {
      triggers: ['خطة', 'استراتيجية', 'هدف', 'نتائج', 'تقرير'],
      responses: [
        'نحتاج لوضع roadmap واضح لتحقيق الأهداف المطلوبة',
        'دعونا نراجع KPIs والـ metrics الخاصة بالمشروع',
        'ما هي التحديات التي تواجهونها في التنفيذ؟',
        'أقترح عقد اجتماعات متابعة أسبوعية لضمان التقدم'
      ],
      delay: 3500,
      priority: 2
    },
    {
      triggers: ['فريق', 'تعاون', 'مسؤولية', 'تكليف'],
      responses: [
        'الفريق يحتاج لتوزيع واضح للمسؤوليات والأدوار',
        'ما رأيكم في تطبيق agile methodology؟',
        'نحن بحاجة لتحسين communication channels بين الأعضاء',
        'دعونا نحدد timeline واضح مع milestones قابلة للقياس'
      ],
      delay: 4000,
      priority: 3
    }
  ]
};

// Contextual responses based on meeting activity
const CONTEXTUAL_RESPONSES = {
  welcomeMessages: [
    'مرحباً بالجميع في هذا الاجتماع المثمر',
    'أهلاً وسهلاً، سعيد بوجودكم معنا اليوم',
    'بسم الله نبدأ، أتمنى لكم جلسة مفيدة',
    'السلام عليكم، لنبدأ بالنقاط المهمة على الأجندة'
  ],
  agreementPhrases: [
    'أتفق معك تماماً في هذه النقطة',
    'فكرة ممتازة، أؤيدك فيها',
    'هذا تحليل صحيح ومنطقي',
    'نعم بالضبط، هذا ما كنت أفكر فيه'
  ],
  questionResponses: [
    'سؤال جيد، دعني أفكر في الإجابة',
    'هذه نقطة مهمة تستحق المناقشة',
    'أعتقد أن الجواب يكمن في...',
    'من وجهة نظري، يمكننا القول أن...'
  ],
  closingMessages: [
    'شكراً لكم جميعاً على هذا الاجتماع المفيد',
    'كان لقاءً مثمراً، بالتوفيق للجميع',
    'أتطلع للمتابعة في الاجتماع القادم',
    'دمتم بخير، ونتواصل قريباً إن شاء الله'
  ]
};

// Generate random virtual participants with diverse personalities
export function generateVirtualParticipants(count: number = 6): VirtualParticipant[] {
  const names = [
    'أحمد المهندس', 'فاطمة المصممة', 'محمد المطور',
    'نور المديرة', 'عبدالله المحلل', 'سارة المسوقة',
    'خالد الاستشاري', 'مريم الخبيرة', 'يوسف المنسق',
    'دعاء المختصة', 'عمر الأخصائي', 'هند المشرفة'
  ];
  
  const avatars = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️'];
  const personalities: Array<'professional' | 'friendly' | 'technical' | 'creative' | 'manager'> = 
    ['professional', 'friendly', 'technical', 'creative', 'manager'];

  return Array.from({ length: Math.min(count, names.length) }, (_, i) => ({
    id: nanoid(),
    name: names[i],
    avatar: avatars[i % avatars.length],
    status: Math.random() > 0.8 ? 'away' : 'active' as const,
    personality: personalities[i % personalities.length],
    joinTime: new Date(Date.now() - Math.random() * 300000), // Joined in last 5 minutes
  }));
}

// Enhanced AI response generation
export class VirtualParticipantAI {
  private participants: VirtualParticipant[];
  private messageHistory: Array<{ content: string; timestamp: Date; sender: string }> = [];
  private lastResponseTime = 0;
  private conversationContext: string[] = [];

  constructor(participants: VirtualParticipant[]) {
    this.participants = participants;
  }

  // Generate intelligent response based on context and personality
  generateResponse(trigger: string, speed: 'slow' | 'medium' | 'fast' = 'medium'): {
    participant: VirtualParticipant;
    message: string;
    delay: number;
  } | null {
    // Prevent too frequent responses
    const now = Date.now();
    const minInterval = speed === 'fast' ? 3000 : speed === 'medium' ? 8000 : 15000;
    
    if (now - this.lastResponseTime < minInterval) {
      return null;
    }

    // Find active participants
    const activeParticipants = this.participants.filter(p => p.status === 'active');
    if (activeParticipants.length === 0) return null;

    // Select participant based on personality relevance
    const relevantParticipant = this.selectRelevantParticipant(trigger, activeParticipants);
    if (!relevantParticipant) return null;

    // Generate contextual response
    const response = this.generateContextualResponse(trigger, relevantParticipant.personality);
    if (!response) return null;

    this.lastResponseTime = now;
    
    // Update conversation context
    this.conversationContext.push(trigger);
    if (this.conversationContext.length > 10) {
      this.conversationContext = this.conversationContext.slice(-10);
    }

    return {
      participant: relevantParticipant,
      message: response.message,
      delay: response.delay
    };
  }

  private selectRelevantParticipant(trigger: string, participants: VirtualParticipant[]): VirtualParticipant | null {
    // Weight participants based on trigger relevance
    const weights = participants.map(p => {
      const patterns = MESSAGE_PATTERNS[p.personality] || [];
      let relevanceScore = 0;
      
      patterns.forEach(pattern => {
        const matches = pattern.triggers.filter(t => trigger.includes(t)).length;
        relevanceScore += matches * pattern.priority;
      });
      
      // Add randomness to avoid same participant always responding
      relevanceScore += Math.random() * 2;
      
      return { participant: p, weight: relevanceScore };
    });

    // Sort by weight and select from top candidates
    weights.sort((a, b) => b.weight - a.weight);
    const topCandidates = weights.slice(0, Math.min(3, weights.length));
    
    if (topCandidates.length === 0 || topCandidates[0].weight === 0) {
      return participants[Math.floor(Math.random() * participants.length)];
    }

    return topCandidates[Math.floor(Math.random() * topCandidates.length)].participant;
  }

  private generateContextualResponse(trigger: string, personality: string): { message: string; delay: number } | null {
    const patterns = MESSAGE_PATTERNS[personality] || [];
    
    // Find matching patterns
    const matchingPatterns = patterns.filter(pattern => 
      pattern.triggers.some(t => trigger.toLowerCase().includes(t.toLowerCase()))
    );

    if (matchingPatterns.length > 0) {
      // Select pattern based on priority
      const selectedPattern = matchingPatterns.sort((a, b) => b.priority - a.priority)[0];
      const response = selectedPattern.responses[Math.floor(Math.random() * selectedPattern.responses.length)];
      
      return {
        message: this.enhanceResponseWithContext(response),
        delay: selectedPattern.delay + Math.random() * 1000
      };
    }

    // Generate contextual response if no specific pattern matches
    return this.generateGenericResponse(personality);
  }

  private enhanceResponseWithContext(baseResponse: string): string {
    // Add contextual elements based on recent conversation
    const contextKeywords = this.conversationContext.join(' ').toLowerCase();
    
    if (contextKeywords.includes('شكرا')) {
      return baseResponse + ' وشكراً لك أيضاً';
    }
    
    if (contextKeywords.includes('مشروع') || contextKeywords.includes('عمل')) {
      return baseResponse + ' ولنضع خطة عملية للتنفيذ';
    }
    
    return baseResponse;
  }

  private generateGenericResponse(personality: string): { message: string; delay: number } | null {
    const generic = {
      professional: [
        'هذه نقطة مهمة تستحق الدراسة',
        'أتفق مع التوجه العام للمناقشة',
        'دعونا نركز على الجوانب العملية',
        'ما رأيكم في تحديد الخطوات التالية؟'
      ],
      friendly: [
        'رأي جميل! أحب هذا التفكير 😊',
        'ما شاء الله عليكم، أفكار رائعة',
        'هذا يذكرني بتجربة مشابهة مررت بها',
        'صراحة موضوع يستحق النقاش أكثر'
      ],
      technical: [
        'من الناحية التقنية، هذا feasible',
        'نحتاج لمراجعة technical requirements',
        'يمكننا تطبيق هذا باستخدام best practices',
        'الفكرة جيدة، لكن نحتاج optimization'
      ],
      creative: [
        'فكرة مبدعة! يمكننا تطويرها أكثر ✨',
        'أحب الابتكار في هذا التوجه',
        'ما رأيكم لو أضفنا لمسة إبداعية؟',
        'هذا يفتح آفاق جديدة للتطوير'
      ],
      manager: [
        'نحتاج لقياس تأثير هذا القرار على الـ timeline',
        'ما هي الموارد المطلوبة لتنفيذ هذا؟',
        'دعونا نحدد المسؤوليات بوضوح',
        'أقترح مراجعة هذا في الاجتماع القادم'
      ]
    };

    const responses = generic[personality as keyof typeof generic] || generic.professional;
    const message = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message,
      delay: 3000 + Math.random() * 2000
    };
  }

  // Simulate participant joining/leaving
  updateParticipantStatus(participantId: string, status: 'active' | 'away' | 'offline') {
    const participant = this.participants.find(p => p.id === participantId);
    if (participant) {
      participant.status = status;
    }
  }

  // Get conversation summary for context
  getConversationSummary(): string {
    return this.conversationContext.slice(-5).join(' ');
  }

  // Auto-generate opening messages when meeting starts
  generateWelcomeMessages(): Array<{ participant: VirtualParticipant; message: string; delay: number }> {
    const activeParticipants = this.participants.filter(p => p.status === 'active').slice(0, 3);
    
    return activeParticipants.map((participant, index) => ({
      participant,
      message: CONTEXTUAL_RESPONSES.welcomeMessages[index % CONTEXTUAL_RESPONSES.welcomeMessages.length],
      delay: (index + 1) * 2000 + Math.random() * 1000
    }));
  }
}