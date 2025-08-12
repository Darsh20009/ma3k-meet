import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMeetingSchema, insertParticipantSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Meeting routes
  app.post("/api/meetings", async (req, res) => {
    try {
      const meetingData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      res.status(400).json({ error: "Invalid meeting data" });
    }
  });

  app.get("/api/meetings", async (req, res) => {
    try {
      const meetings = await storage.getActiveMeetings();
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meeting" });
    }
  });

  app.put("/api/meetings/:id", async (req, res) => {
    try {
      const updates = req.body;
      const meeting = await storage.updateMeeting(req.params.id, updates);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  // Participant routes
  app.post("/api/participants", async (req, res) => {
    try {
      const participantData = insertParticipantSchema.parse(req.body);
      const participant = await storage.addParticipant(participantData);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ error: "Invalid participant data" });
    }
  });

  app.get("/api/meetings/:meetingId/participants", async (req, res) => {
    try {
      const participants = await storage.getParticipants(req.params.meetingId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.delete("/api/participants/:id", async (req, res) => {
    try {
      const success = await storage.removeParticipant(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove participant" });
    }
  });

  // Chat routes
  app.get("/api/meetings/:meetingId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.meetingId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.addMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_meeting') {
          ws.meetingId = message.meetingId;
          ws.send(JSON.stringify({
            type: 'joined',
            meetingId: message.meetingId
          }));
        }
        
        if (message.type === 'send_message') {
          const chatMessage = await storage.addMessage({
            meetingId: message.meetingId,
            senderId: null, // User message
            senderName: message.senderName || 'أنت',
            senderAvatar: message.senderAvatar || 'أ',
            message: message.message,
            isSystemMessage: false
          });

          // Broadcast to all clients in the same meeting
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.meetingId === message.meetingId) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: chatMessage
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
