import { type Meeting, type InsertMeeting, type VirtualParticipant, type InsertParticipant, type RealUser, type InsertUser, type ChatMessage, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Meeting operations
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  getActiveMeetings(): Promise<Meeting[]>;
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<boolean>;

  // Participant operations
  addParticipant(participant: InsertParticipant): Promise<VirtualParticipant>;
  getParticipants(meetingId: string): Promise<VirtualParticipant[]>;
  updateParticipant(id: string, updates: Partial<VirtualParticipant>): Promise<VirtualParticipant | undefined>;
  removeParticipant(id: string): Promise<boolean>;

  // Real user operations
  addRealUser(user: InsertUser): Promise<RealUser>;
  getRealUsers(meetingId: string): Promise<RealUser[]>;
  updateRealUser(id: string, updates: Partial<RealUser>): Promise<RealUser | undefined>;
  removeRealUser(id: string): Promise<boolean>;

  // Chat operations
  addMessage(message: InsertMessage): Promise<ChatMessage>;
  getMessages(meetingId: string): Promise<ChatMessage[]>;
  deleteMessage(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private meetings: Map<string, Meeting>;
  private participants: Map<string, VirtualParticipant>;
  private realUsers: Map<string, RealUser>;
  private messages: Map<string, ChatMessage>;

  constructor() {
    this.meetings = new Map();
    this.participants = new Map();
    this.realUsers = new Map();
    this.messages = new Map();
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const meeting: Meeting = {
      id,
      name: insertMeeting.name,
      type: insertMeeting.type || "اجتماع عمل",
      createdAt: new Date(),
      isActive: insertMeeting.isActive ?? true,
      settings: insertMeeting.settings || { messageSpeed: "medium", conversationType: "friendly", autoSounds: false }
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter(m => m.isActive);
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const updated = { ...meeting, ...updates };
    this.meetings.set(id, updated);
    return updated;
  }

  async deleteMeeting(id: string): Promise<boolean> {
    return this.meetings.delete(id);
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<VirtualParticipant> {
    const id = randomUUID();
    const participant: VirtualParticipant = {
      id,
      meetingId: insertParticipant.meetingId || null,
      name: insertParticipant.name,
      avatar: insertParticipant.avatar,
      status: insertParticipant.status || "active",
      personality: insertParticipant.personality || "professional"
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipants(meetingId: string): Promise<VirtualParticipant[]> {
    return Array.from(this.participants.values()).filter(p => p.meetingId === meetingId);
  }

  async updateParticipant(id: string, updates: Partial<VirtualParticipant>): Promise<VirtualParticipant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updated = { ...participant, ...updates };
    this.participants.set(id, updated);
    return updated;
  }

  async removeParticipant(id: string): Promise<boolean> {
    return this.participants.delete(id);
  }

  async addRealUser(insertUser: InsertUser): Promise<RealUser> {
    const id = randomUUID();
    const user: RealUser = {
      id,
      meetingId: insertUser.meetingId || null,
      name: insertUser.name,
      avatar: insertUser.avatar,
      status: insertUser.status || "active",
      joinedAt: new Date(),
      isOnline: insertUser.isOnline ?? true,
      isHost: insertUser.isHost ?? false
    };
    this.realUsers.set(id, user);
    return user;
  }

  async getRealUsers(meetingId: string): Promise<RealUser[]> {
    return Array.from(this.realUsers.values()).filter(u => u.meetingId === meetingId);
  }

  async updateRealUser(id: string, updates: Partial<RealUser>): Promise<RealUser | undefined> {
    const user = this.realUsers.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.realUsers.set(id, updated);
    return updated;
  }

  async removeRealUser(id: string): Promise<boolean> {
    return this.realUsers.delete(id);
  }

  async addMessage(insertMessage: InsertMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      meetingId: insertMessage.meetingId || null,
      senderId: insertMessage.senderId || null,
      senderName: insertMessage.senderName,
      senderAvatar: insertMessage.senderAvatar || null,
      message: insertMessage.message,
      timestamp: new Date(),
      isSystemMessage: insertMessage.isSystemMessage ?? false,
      isFromRealUser: insertMessage.isFromRealUser ?? false
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(meetingId: string): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(m => m.meetingId === meetingId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }
}

export const storage = new MemStorage();
