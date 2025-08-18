import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import type { InsertMeeting, Meeting, InsertParticipant, VirtualParticipant, InsertUser, RealUser, InsertMessage, ChatMessage } from '@shared/schema';

interface Data {
  meetings: Meeting[];
  participants: VirtualParticipant[];
  realUsers: RealUser[];
  messages: ChatMessage[];
  activeSessions: Record<string, Record<string, any>>;
}

export class JSONStorage {
  private dataFile = 'server/data.json';
  private data: Data = { meetings: [], participants: [], realUsers: [], messages: [], activeSessions: {} };

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    if (existsSync(this.dataFile)) {
      try {
        const fileContent = readFileSync(this.dataFile, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (error) {
        console.error('Failed to load data, creating new:', error);
        this.data = { meetings: [], participants: [], realUsers: [], messages: [], activeSessions: {} };
      }
    } else {
      this.data = { meetings: [], participants: [], realUsers: [], messages: [], activeSessions: {} };
    }
  }

  private saveData(): void {
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Meeting operations
  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const meetingCode = insertMeeting.meetingCode || Math.random().toString().slice(2, 8);
    
    const newMeeting: Meeting = {
      id: randomUUID(),
      name: insertMeeting.name,
      type: insertMeeting.type || "اجتماع عمل",
      meetingCode: meetingCode,
      hostId: insertMeeting.hostId || 'anonymous-host',
      password: insertMeeting.password || null,
      isPasswordProtected: !!insertMeeting.password,
      maxParticipants: insertMeeting.maxParticipants || 100,
      waitingRoom: insertMeeting.waitingRoom || false,
      recordMeeting: insertMeeting.recordMeeting || false,
      allowScreenShare: insertMeeting.allowScreenShare !== undefined ? insertMeeting.allowScreenShare : true,
      allowChat: insertMeeting.allowChat !== undefined ? insertMeeting.allowChat : true,
      muteOnJoin: insertMeeting.muteOnJoin || false,
      isActive: true,
      settings: {
        messageSpeed: insertMeeting.settings?.messageSpeed || "medium",
        conversationType: insertMeeting.settings?.conversationType || "friendly",
        autoSounds: insertMeeting.settings?.autoSounds || false,
        virtualParticipantsEnabled: insertMeeting.settings?.virtualParticipantsEnabled !== undefined ? insertMeeting.settings.virtualParticipantsEnabled : true,
        backgroundEffects: insertMeeting.settings?.backgroundEffects !== undefined ? insertMeeting.settings.backgroundEffects : true,
        reactionAnimations: insertMeeting.settings?.reactionAnimations !== undefined ? insertMeeting.settings.reactionAnimations : true
      },
      createdAt: new Date()
    };
    
    this.data.meetings.push(newMeeting);
    this.data.activeSessions[newMeeting.id] = {};
    
    // Automatically add default virtual participants if enabled
    if (newMeeting.settings && newMeeting.settings.virtualParticipantsEnabled) {
      await this.addDefaultVirtualParticipants(newMeeting.id);
    }
    
    this.saveData();
    
    return newMeeting;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.data.meetings.find(m => m.id === id);
  }

  async getMeetingByCode(code: string): Promise<Meeting | undefined> {
    return this.data.meetings.find(m => m.meetingCode === code);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.data.meetings;
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const index = this.data.meetings.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    this.data.meetings[index] = { ...this.data.meetings[index], ...updates };
    this.saveData();
    return this.data.meetings[index];
  }

  async deleteMeeting(id: string): Promise<boolean> {
    const index = this.data.meetings.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.data.meetings.splice(index, 1);
    delete this.data.activeSessions[id];
    this.data.participants = this.data.participants.filter(p => p.meetingId !== id);
    this.data.realUsers = this.data.realUsers.filter(u => u.meetingId !== id);
    this.data.messages = this.data.messages.filter(m => m.meetingId !== id);
    this.saveData();
    return true;
  }

  // Participant operations
  async addParticipant(participant: InsertParticipant): Promise<VirtualParticipant> {
    const newParticipant: VirtualParticipant = {
      id: randomUUID(),
      meetingId: participant.meetingId || null,
      name: participant.name,
      avatar: participant.avatar,
      status: participant.status || 'active',
      personality: participant.personality || 'professional'
    };
    
    this.data.participants.push(newParticipant);
    this.saveData();
    return newParticipant;
  }

  async getParticipants(meetingId: string): Promise<VirtualParticipant[]> {
    return this.data.participants.filter(p => p.meetingId === meetingId);
  }

  async updateParticipant(id: string, updates: Partial<VirtualParticipant>): Promise<VirtualParticipant | undefined> {
    const index = this.data.participants.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.data.participants[index] = { ...this.data.participants[index], ...updates };
    this.saveData();
    return this.data.participants[index];
  }

  async removeParticipant(id: string): Promise<boolean> {
    const index = this.data.participants.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.data.participants.splice(index, 1);
    this.saveData();
    return true;
  }

  // Real user operations
  async addRealUser(user: InsertUser): Promise<RealUser> {
    const newUser: RealUser = {
      id: randomUUID(),
      meetingId: user.meetingId || '',
      name: user.name,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      status: user.status || 'active',
      joinedAt: new Date(),
      isOnline: user.isOnline !== undefined ? user.isOnline : true,
      isHost: user.isHost || false
    };
    
    this.data.realUsers.push(newUser);
    
    const meetingId = user.meetingId || '';
    if (meetingId && !this.data.activeSessions[meetingId]) {
      this.data.activeSessions[meetingId] = {};
    }
    if (meetingId) {
      this.data.activeSessions[meetingId][newUser.id] = {
        name: user.name,
        joinedAt: new Date().toISOString(),
        isActive: true
      };
    }
    
    this.saveData();
    return newUser;
  }

  async getRealUsers(meetingId: string): Promise<RealUser[]> {
    return this.data.realUsers.filter(u => u.meetingId === meetingId);
  }

  async updateRealUser(id: string, updates: Partial<RealUser>): Promise<RealUser | undefined> {
    const index = this.data.realUsers.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.data.realUsers[index] = { ...this.data.realUsers[index], ...updates };
    
    const user = this.data.realUsers[index];
    if (user.meetingId && this.data.activeSessions[user.meetingId]?.[id]) {
      this.data.activeSessions[user.meetingId][id].isActive = updates.isOnline !== undefined ? updates.isOnline : true;
    }
    
    this.saveData();
    return this.data.realUsers[index];
  }

  async removeRealUser(id: string): Promise<boolean> {
    const index = this.data.realUsers.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    const user = this.data.realUsers[index];
    this.data.realUsers.splice(index, 1);
    
    if (user.meetingId && this.data.activeSessions[user.meetingId]) {
      delete this.data.activeSessions[user.meetingId][id];
    }
    
    this.saveData();
    return true;
  }

  // Message operations
  async addMessage(message: InsertMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: randomUUID(),
      meetingId: message.meetingId || '',
      senderId: message.senderId || '',
      senderName: message.senderName,
      senderAvatar: message.senderAvatar || null,
      message: message.message,
      timestamp: new Date(),
      isSystemMessage: message.isSystemMessage || false,
      isFromRealUser: message.isFromRealUser || false
    };
    
    this.data.messages.push(newMessage);
    this.saveData();
    return newMessage;
  }

  async getMessages(meetingId: string): Promise<ChatMessage[]> {
    return this.data.messages
      .filter(m => m.meetingId === meetingId)
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });
  }

  async deleteMessage(id: string): Promise<boolean> {
    const index = this.data.messages.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.data.messages.splice(index, 1);
    this.saveData();
    return true;
  }

  // Session management
  async getActiveSessions(meetingId: string): Promise<Record<string, any>> {
    return this.data.activeSessions[meetingId] || {};
  }

  async updateSession(meetingId: string, sessionId: string, sessionData: any): Promise<void> {
    if (!this.data.activeSessions[meetingId]) {
      this.data.activeSessions[meetingId] = {};
    }
    this.data.activeSessions[meetingId][sessionId] = sessionData;
    this.saveData();
  }

  async removeSession(meetingId: string, sessionId: string): Promise<void> {
    if (this.data.activeSessions[meetingId]) {
      delete this.data.activeSessions[meetingId][sessionId];
      this.saveData();
    }
  }

  // Add default virtual participants to a new meeting
  async addDefaultVirtualParticipants(meetingId: string): Promise<VirtualParticipant[]> {
    const defaultParticipants = [
      {
        name: 'أحمد المهندس',
        avatar: '👨‍💼',
        personality: 'professional',
        status: 'active'
      },
      {
        name: 'فاطمة المصممة',
        avatar: '👩‍🎨',
        personality: 'creative',
        status: 'active'
      },
      {
        name: 'محمد المطور',
        avatar: '👨‍💻',
        personality: 'technical',
        status: 'active'
      },
      {
        name: 'نور المديرة',
        avatar: '👩‍💼',
        personality: 'manager',
        status: 'active'
      },
      {
        name: 'سارة المسوقة',
        avatar: '👩‍💻',
        personality: 'friendly',
        status: 'active'
      }
    ];

    const addedParticipants: VirtualParticipant[] = [];

    for (const participantData of defaultParticipants) {
      const participant = await this.addParticipant({
        meetingId: meetingId,
        name: participantData.name,
        avatar: participantData.avatar,
        personality: participantData.personality,
        status: participantData.status
      });
      addedParticipants.push(participant);
    }

    return addedParticipants;
  }
}

export const jsonStorage = new JSONStorage();