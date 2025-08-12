import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("اجتماع عمل"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").$type<{
    messageSpeed: "slow" | "medium" | "fast";
    conversationType: "formal" | "friendly" | "technical";
    autoSounds: boolean;
  }>().default({
    messageSpeed: "medium",
    conversationType: "friendly",
    autoSounds: false
  })
});

export const virtualParticipants = pgTable("virtual_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  status: text("status").notNull().default("active"), // active, away, offline
  personality: text("personality").notNull().default("professional")
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id),
  senderId: varchar("sender_id"), // null for user messages
  senderName: text("sender_name").notNull(),
  senderAvatar: text("sender_avatar"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isSystemMessage: boolean("is_system_message").default(false)
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true
});

export const insertParticipantSchema = createInsertSchema(virtualParticipants).omit({
  id: true
});

export const insertMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type VirtualParticipant = typeof virtualParticipants.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
