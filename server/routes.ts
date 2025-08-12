import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMeetingSchema, insertParticipantSchema, insertUserSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

// Extend WebSocket type to include custom properties
interface ExtendedWebSocket extends WebSocket {
  meetingId?: string;
  userId?: string;
}

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

  // Real user routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.addRealUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/meetings/:meetingId/users", async (req, res) => {
    try {
      const users = await storage.getRealUsers(req.params.meetingId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateRealUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.removeRealUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove user" });
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
    const extendedWs = ws as ExtendedWebSocket;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_meeting') {
          extendedWs.meetingId = message.meetingId;
          ws.send(JSON.stringify({
            type: 'joined',
            meetingId: message.meetingId
          }));
        }

        // WebRTC signaling
        if (message.type === 'join_webrtc') {
          extendedWs.meetingId = message.meetingId;
          extendedWs.userId = message.userId;
          
          // Notify other users in the meeting
          wss.clients.forEach((client) => {
            const extendedClient = client as ExtendedWebSocket;
            if (client !== ws && client.readyState === WebSocket.OPEN && 
                extendedClient.meetingId === message.meetingId) {
              client.send(JSON.stringify({
                type: 'webrtc_user_joined',
                userId: message.userId,
                userName: message.userName
              }));
            }
          });
        }

        if (message.type === 'webrtc_offer' || message.type === 'webrtc_answer' || message.type === 'webrtc_ice_candidate') {
          // Forward signaling messages to target user
          wss.clients.forEach((client) => {
            const extendedClient = client as ExtendedWebSocket;
            if (client.readyState === WebSocket.OPEN && 
                extendedClient.userId === message.targetUserId &&
                extendedClient.meetingId === message.meetingId) {
              client.send(JSON.stringify({
                type: message.type,
                userId: message.userId,
                ...(message.offer && { offer: message.offer }),
                ...(message.answer && { answer: message.answer }),
                ...(message.candidate && { candidate: message.candidate })
              }));
            }
          });
        }
        
        if (message.type === 'user_joined') {
          // Add real user to meeting
          const userData = {
            meetingId: message.meetingId,
            name: message.userName,
            avatar: message.userAvatar || message.userName.slice(0, 2),
            status: 'active' as const,
            isOnline: true,
            isHost: message.isHost || false
          };
          
          const user = await storage.addRealUser(userData);
          extendedWs.userId = user.id;
          
          // Broadcast user joined to all clients in this meeting
          wss.clients.forEach((client) => {
            const extendedClient = client as ExtendedWebSocket;
            if (client.readyState === WebSocket.OPEN && extendedClient.meetingId === message.meetingId) {
              client.send(JSON.stringify({
                type: 'user_joined',
                user: user
              }));
            }
          });
        }
        
        if (message.type === 'send_message') {
          const chatMessage = await storage.addMessage({
            meetingId: message.meetingId,
            senderId: extendedWs.userId || null, // Use the stored user ID
            senderName: message.senderName || 'أنت',
            senderAvatar: message.senderAvatar || 'أ',
            message: message.message,
            isSystemMessage: false,
            isFromRealUser: true
          });

          // Broadcast message to all clients in the same meeting
          wss.clients.forEach((client) => {
            const extendedClient = client as ExtendedWebSocket;
            if (client.readyState === WebSocket.OPEN && extendedClient.meetingId === message.meetingId) {
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

    ws.on('close', async () => {
      console.log('Client disconnected from WebSocket');
      
      // Mark user as offline if they were connected
      const extendedWs = ws as ExtendedWebSocket;
      if (extendedWs.userId) {
        await storage.updateRealUser(extendedWs.userId, { isOnline: false });
        
        // Broadcast user left to remaining clients
        wss.clients.forEach((client) => {
          const extendedClient = client as ExtendedWebSocket;
          if (client.readyState === WebSocket.OPEN && extendedClient.meetingId === extendedWs.meetingId) {
            client.send(JSON.stringify({
              type: 'user_left',
              userId: extendedWs.userId
            }));
          }
        });
      }
    });
  });

  return httpServer;
}
