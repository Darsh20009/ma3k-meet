// Realistic behavior simulation for virtual participants
import { VirtualParticipant } from '@shared/schema';

export interface ParticipantBehavior {
  isCurrentlySpeaking: boolean;
  hasRecentActivity: boolean;
  activityDescription: string;
  speakingDuration: number;
  lastActivityTime: Date;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isCameraOn: boolean;
  isMuted: boolean;
}

export class RealisticBehaviorSimulator {
  private behaviorStates = new Map<string, ParticipantBehavior>();
  private behaviorTimer: NodeJS.Timeout | null = null;

  constructor(private participants: VirtualParticipant[]) {
    this.initializeBehaviors();
    this.startBehaviorSimulation();
  }

  private initializeBehaviors(): void {
    this.participants.forEach(participant => {
      this.behaviorStates.set(participant.id, {
        isCurrentlySpeaking: false,
        hasRecentActivity: Math.random() > 0.5,
        activityDescription: this.getActivityForPersonality(participant.personality),
        speakingDuration: 0,
        lastActivityTime: new Date(Date.now() - Math.random() * 300000), // Random activity within last 5 minutes
        connectionQuality: this.getRandomConnectionQuality(),
        isCameraOn: Math.random() > 0.2, // 80% chance camera is on
        isMuted: Math.random() > 0.7 // 30% chance of being muted
      });
    });
  }

  private getActivityForPersonality(personality: string): string {
    const activities = {
      professional: [
        'يراجع الملاحظات',
        'يحضر التقرير',
        'يدون النقاط المهمة',
        'يتابع جدول الأعمال'
      ],
      creative: [
        'يقترح أفكار جديدة',
        'يصمم مفاهيم إبداعية',
        'يطور حلول مبتكرة',
        'يرسم المخططات'
      ],
      technical: [
        'يحلل البيانات',
        'يراجع الكود',
        'يختبر الحلول',
        'يطور الخوارزميات'
      ],
      manager: [
        'يتابع التقدم',
        'يراجع الجدول الزمني',
        'يقيم المخاطر',
        'يخطط للمراحل القادمة'
      ],
      friendly: [
        'يستمع بانتباه',
        'يشارك في النقاش',
        'يدعم الفريق',
        'يقدم التشجيع'
      ]
    };

    const personalityActivities = activities[personality as keyof typeof activities] || activities.friendly;
    return personalityActivities[Math.floor(Math.random() * personalityActivities.length)];
  }

  private getRandomConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const rand = Math.random();
    if (rand > 0.8) return 'excellent';
    if (rand > 0.6) return 'good';
    if (rand > 0.3) return 'fair';
    return 'poor';
  }

  private startBehaviorSimulation(): void {
    this.behaviorTimer = setInterval(() => {
      this.updateBehaviors();
    }, 3000); // Update every 3 seconds
  }

  private updateBehaviors(): void {
    this.participants.forEach(participant => {
      const behavior = this.behaviorStates.get(participant.id);
      if (!behavior) return;

      // Simulate speaking patterns
      if (behavior.isCurrentlySpeaking) {
        behavior.speakingDuration += 3;
        if (behavior.speakingDuration > 15 || Math.random() > 0.7) {
          behavior.isCurrentlySpeaking = false;
          behavior.speakingDuration = 0;
        }
      } else {
        // 15% chance to start speaking if active and not muted
        if (participant.status === 'active' && !behavior.isMuted && Math.random() > 0.85) {
          behavior.isCurrentlySpeaking = true;
        }
      }

      // Update activity status
      const timeSinceLastActivity = Date.now() - behavior.lastActivityTime.getTime();
      if (timeSinceLastActivity > 60000) { // 1 minute
        if (Math.random() > 0.6) {
          behavior.hasRecentActivity = true;
          behavior.lastActivityTime = new Date();
          behavior.activityDescription = this.getActivityForPersonality(participant.personality);
        }
      } else {
        behavior.hasRecentActivity = timeSinceLastActivity < 30000; // Show activity for 30 seconds
      }

      // Randomly update connection quality
      if (Math.random() > 0.95) {
        behavior.connectionQuality = this.getRandomConnectionQuality();
      }

      // Randomly update mute status
      if (Math.random() > 0.98) {
        behavior.isMuted = !behavior.isMuted;
      }

      // Randomly update camera status
      if (Math.random() > 0.99) {
        behavior.isCameraOn = !behavior.isCameraOn;
      }
    });
  }

  getBehavior(participantId: string): ParticipantBehavior | undefined {
    return this.behaviorStates.get(participantId);
  }

  getAllBehaviors(): Map<string, ParticipantBehavior> {
    return this.behaviorStates;
  }

  destroy(): void {
    if (this.behaviorTimer) {
      clearInterval(this.behaviorTimer);
      this.behaviorTimer = null;
    }
  }
}

// Virtual participant message generator with realistic timing
export class VirtualParticipantMessageGenerator {
  private messageQueues = new Map<string, string[]>();
  private messageTimer: NodeJS.Timeout | null = null;

  constructor(
    private participants: VirtualParticipant[],
    private onMessage: (participantId: string, message: string) => void
  ) {
    this.initializeMessageQueues();
    this.startMessageGeneration();
  }

  private initializeMessageQueues(): void {
    this.participants.forEach(participant => {
      this.messageQueues.set(participant.id, this.getMessagesForPersonality(participant.personality));
    });
  }

  private getMessagesForPersonality(personality: string): string[] {
    const messages = {
      professional: [
        'أتفق مع النقاط المطروحة، دعونا نضع خطة تنفيذية',
        'هل يمكننا مراجعة الجدول الزمني؟',
        'أقترح تحديد الأولويات بوضوح',
        'نحتاج لقياس النتائج بطريقة دقيقة'
      ],
      creative: [
        'لدي فكرة مبتكرة لهذا التحدي! 🎨',
        'ما رأيكم لو جربنا منهجاً مختلفاً؟',
        'يمكننا إضافة لمسة إبداعية هنا',
        'هذا يذكرني بمشروع ملهم عملت عليه'
      ],
      technical: [
        'من الناحية التقنية، هذا ممكن التنفيذ',
        'نحتاج لتحسين الأداء والـ scalability',
        'أقترح استخدام best practices في هذا الجزء',
        'دعونا نحلل البيانات بدقة أكبر'
      ],
      manager: [
        'ما هي المخاطر المحتملة هنا؟',
        'نحتاج لتحديد timeline واضح للتنفيذ',
        'كيف سنقيس نجاح هذا المشروع؟',
        'دعونا نتأكد من توفر الموارد اللازمة'
      ],
      friendly: [
        'فكرة رائعة! أحب هذا التوجه 😊',
        'شكراً لكم على هذا الطرح المفيد',
        'أنا متحمس لرؤية النتائج',
        'الفريق يعمل بشكل رائع اليوم!'
      ]
    };

    return messages[personality as keyof typeof messages] || messages.friendly;
  }

  private startMessageGeneration(): void {
    this.messageTimer = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every interval
        this.generateRandomMessage();
      }
    }, 8000); // Every 8 seconds
  }

  private generateRandomMessage(): void {
    if (this.participants.length === 0) return;

    const randomParticipant = this.participants[Math.floor(Math.random() * this.participants.length)];
    const messages = this.messageQueues.get(randomParticipant.id) || [];
    
    if (messages.length > 0) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      this.onMessage(randomParticipant.id, randomMessage);
    }
  }

  addCustomMessage(participantId: string, message: string): void {
    this.onMessage(participantId, message);
  }

  destroy(): void {
    if (this.messageTimer) {
      clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
  }
}