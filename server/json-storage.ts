import { writeFileSync, readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import type { Meeting, InsertMeeting, VirtualParticipant, InsertParticipant, RealUser, InsertUser, ChatMessage, InsertMessage } from "@shared/schema";

interface StorageData {
  meetings: Meeting[];
  participants: VirtualParticipant[];
  realUsers: RealUser[];
  messages: ChatMessage[];
  activeSessions: { [meetingId: string]: { [userId: string]: { name: string, joinedAt: string, isActive: boolean } } };
}

export class JSONStorage {
  private dataFile = './server/data.json';
  private data: StorageData = {
    meetings: [],
    participants: [],
    realUsers: [],
    messages: [],
    activeSessions: {}
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (existsSync(this.dataFile)) {
        const rawData = readFileSync(this.dataFile, 'utf-8');
        this.data = JSON.parse(rawData);
      } else {
        this.data = {
          meetings: [],
          participants: [],
          realUsers: [],
          messages: [],
          activeSessions: {}
        };
        this.saveData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = {
        meetings: [],
        participants: [],
        realUsers: [],
        messages: [],
        activeSessions: {}
      };
    }
  }

  private saveData() {
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Meeting operations
  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const meetingCode = Math.random().toString().slice(2, 8); // Generate 6-digit code
    const meeting: Meeting = {
      id: randomUUID(),
      name: insertMeeting.name,
      type: insertMeeting.type || "اجتماع عمل",
      meetingCode: meetingCode,
      password: insertMeeting.password,
      isPasswordProtected: !!insertMeeting.password,
      maxParticipants: insertMeeting.maxParticipants || 100,
      waitingRoom: insertMeeting.waitingRoom || false,
      recordMeeting: insertMeeting.recordMeeting || false,
      allowScreenShare: insertMeeting.allowScreenShare ?? true,
      allowChat: insertMeeting.allowChat ?? true,
      muteOnJoin: insertMeeting.muteOnJoin || false,
      hostId: insertMeeting.hostId || randomUUID(),
      createdAt: new Date(),
      isActive: insertMeeting.isActive ?? true,
      settings: insertMeeting.settings || { 
        messageSpeed: "medium" as const, 
        conversationType: "friendly" as const, 
        autoSounds: false,
        virtualParticipantsEnabled: true,
        backgroundEffects: true,
        reactionAnimations: true
      }
    };
    
    this.data.meetings.push(meeting);
    this.data.activeSessions[meeting.id] = {};
    this.saveData();
    return meeting;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.data.meetings.find(m => m.id === id);
  }

  async getMeetingByCode(meetingCode: string): Promise<Meeting | undefined> {
    return this.data.meetings.find(m => m.meetingCode === meetingCode);
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    return this.data.meetings.filter(m => m.isActive);
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
    // Clean up related data
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
      meetingId: participant.meetingId,
      name: participant.name,
      avatar: participant.avatar,
      status: participant.status || 'active',
      createdAt: new Date()
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
      meetingId: user.meetingId,
      name: user.name,
      isOnline: user.isOnline ?? true,
      joinedAt: new Date()
    };
    
    this.data.realUsers.push(newUser);
    
    // Add to active session
    const meetingId = user.meetingId;
    if (!this.data.activeSessions[meetingId]) {
      this.data.activeSessions[meetingId] = {};
    }
    this.data.activeSessions[meetingId][newUser.id] = {
      name: user.name,
      joinedAt: new Date().toISOString(),
      isActive: true
    };
    
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
    
    // Update active session
    const user = this.data.realUsers[index];
    const meetingId = user.meetingId;
    const session = this.data.activeSessions[meetingId];
    if (session && session[id]) {
      session[id].isActive = updates.isOnline ?? true;
    }
    
    this.saveData();
    return this.data.realUsers[index];
  }

  async removeRealUser(id: string): Promise<boolean> {
    const userIndex = this.data.realUsers.findIndex(u => u.id === id);
    if (userIndex === -1) return false;
    
    const user = this.data.realUsers[userIndex];
    const meetingId = user.meetingId;
    this.data.realUsers.splice(userIndex, 1);
    
    // Remove from active session
    const session = this.data.activeSessions[meetingId];
    if (session && session[id]) {
      delete this.data.activeSessions[meetingId][id];
    }
    
    this.saveData();
    return true;
  }

  // Chat operations
  async addMessage(message: InsertMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: randomUUID(),
      meetingId: message.meetingId,
      senderId: message.senderId || randomUUID(),
      senderName: message.senderName || 'مستخدم',
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
    return this.data.messages.filter(m => m.meetingId === meetingId);
  }

  async deleteMessage(id: string): Promise<boolean> {
    const index = this.data.messages.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.data.messages.splice(index, 1);
    this.saveData();
    return true;
  }

  // Session management
  async addUserToMeeting(meetingId: string, userId: string, userName: string): Promise<void> {
    if (!this.data.activeSessions[meetingId]) {
      this.data.activeSessions[meetingId] = {};
    }
    
    this.data.activeSessions[meetingId][userId] = {
      name: userName,
      joinedAt: new Date().toISOString(),
      isActive: true
    };
    
    this.saveData();
  }

  async removeUserFromMeeting(meetingId: string, userId: string): Promise<void> {
    const session = this.data.activeSessions[meetingId];
    if (session && session[userId]) {
      delete this.data.activeSessions[meetingId][userId];
      this.saveData();
    }
  }

  async getActiveMeetingUsers(meetingId: string): Promise<{id: string, name: string, joinedAt: Date}[]> {
    const session = this.data.activeSessions[meetingId];
    if (!session) return [];
    
    return Object.entries(session)
      .filter(([_, data]) => data.isActive)
      .map(([userId, data]) => ({
        id: userId,
        name: data.name,
        joinedAt: new Date(data.joinedAt)
      }));
  }

  // Get all data for debugging
  async getAllData(): Promise<StorageData> {
    return this.data;
  }

  // Clean up old sessions (call periodically)
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    
    Object.keys(this.data.activeSessions).forEach(meetingId => {
      Object.entries(this.data.activeSessions[meetingId]).forEach(([userId, data]) => {
        const joinedAt = new Date(data.joinedAt);
        if (joinedAt < cutoffTime) {
          delete this.data.activeSessions[meetingId][userId];
        }
      });
      
      // Remove empty meeting sessions
      if (Object.keys(this.data.activeSessions[meetingId]).length === 0) {
        delete this.data.activeSessions[meetingId];
      }
    });
    
    this.saveData();
  }
}

export const jsonStorage = new JSONStorage();