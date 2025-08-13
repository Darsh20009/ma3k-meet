import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { jsonStorage } from "./json-storage-fixed";
import { insertMeetingSchema, insertParticipantSchema, insertUserSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

// Extend WebSocket type to include custom properties
interface ExtendedWebSocket extends WebSocket {
  meetingId?: string;
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Meeting routes - Using JSON Storage
  app.post("/api/meetings", async (req, res) => {
    try {
      console.log('Raw meeting data received:', JSON.stringify(req.body, null, 2));
      
      // Add defaults for required fields that might be missing
      const meetingData = {
        ...req.body,
        meetingCode: req.body.meetingCode || Math.random().toString().slice(2, 8),
        hostId: req.body.hostId || 'anonymous-host',
        isPasswordProtected: req.body.isPasswordProtected || false,
        maxParticipants: req.body.maxParticipants || 100,
        waitingRoom: req.body.waitingRoom || false,
        recordMeeting: req.body.recordMeeting || false,
        allowScreenShare: req.body.allowScreenShare !== undefined ? req.body.allowScreenShare : true,
        allowChat: req.body.allowChat !== undefined ? req.body.allowChat : true,
        muteOnJoin: req.body.muteOnJoin || false,
        settings: req.body.settings || {
          messageSpeed: 'medium',
          conversationType: 'friendly',
          autoSounds: false,
          virtualParticipantsEnabled: true,
          backgroundEffects: true,
          reactionAnimations: true
        }
      };

      console.log('Processed meeting data:', JSON.stringify(meetingData, null, 2));
      
      const validatedData = insertMeetingSchema.parse(meetingData);
      console.log('Validation successful:', JSON.stringify(validatedData, null, 2));
      
      const meeting = await jsonStorage.createMeeting(validatedData);
      console.log('Meeting created successfully:', JSON.stringify(meeting, null, 2));
      
      res.json(meeting);
    } catch (error: any) {
      console.error('Meeting creation failed:', error);
      console.error('Error details:', error.errors || error.message);
      
      const errorMessage = error.errors 
        ? `Validation failed: ${error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        : error.message || "Invalid meeting data";
        
      res.status(400).json({ 
        error: errorMessage,
        details: error.errors || error.message
      });
    }
  });

  app.get("/api/meetings", async (req, res) => {
    try {
      const meetings = await jsonStorage.getAllMeetings();
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await jsonStorage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      const participants = await jsonStorage.getParticipants(req.params.id);
      const realUsers = await jsonStorage.getRealUsers(req.params.id);
      const sessionUsers = await jsonStorage.getActiveSessions(req.params.id);
      const totalCount = participants.length + realUsers.length;
      
      if (totalCount >= (meeting.maxParticipants || 100)) {
        return res.status(423).json({ error: "Meeting is at capacity" });
      }

      res.json({ 
        meeting, 
        participants, 
        realUsers, 
        sessionUsers: sessionUsers || {},
        totalCount 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meeting" });
    }
  });

  app.get("/api/meetings/code/:code", async (req, res) => {
    try {
      const meeting = await jsonStorage.getMeetingByCode(req.params.code);
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
      const meeting = await jsonStorage.updateMeeting(req.params.id, updates);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    try {
      const success = await jsonStorage.deleteMeeting(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // Participant routes - JSON Storage
  app.post("/api/participants", async (req, res) => {
    try {
      const participantData = insertParticipantSchema.parse(req.body);
      const participant = await jsonStorage.addParticipant(participantData);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ error: "Invalid participant data" });
    }
  });

  app.get("/api/meetings/:meetingId/participants", async (req, res) => {
    try {
      const participants = await jsonStorage.getParticipants(req.params.meetingId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.put("/api/participants/:id", async (req, res) => {
    try {
      const updates = req.body;
      const participant = await jsonStorage.updateParticipant(req.params.id, updates);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update participant" });
    }
  });

  app.delete("/api/participants/:id", async (req, res) => {
    try {
      const success = await jsonStorage.removeParticipant(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove participant" });
    }
  });

  // Real user routes - JSON Storage with session tracking
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await jsonStorage.addRealUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/meetings/:meetingId/users", async (req, res) => {
    try {
      const users = await jsonStorage.getRealUsers(req.params.meetingId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/meetings/:id/session-users", async (req, res) => {
    try {
      const sessions = await jsonStorage.getActiveSessions(req.params.id);
      res.json(sessions || {});
    } catch (error) {
      console.error('Session users error:', error);
      res.status(200).json({});
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await jsonStorage.updateRealUser(req.params.id, updates);
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
      const success = await jsonStorage.removeRealUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove user" });
    }
  });

  // Chat routes - JSON Storage
  app.get("/api/meetings/:meetingId/messages", async (req, res) => {
    try {
      const messages = await jsonStorage.getMessages(req.params.meetingId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await jsonStorage.addMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // WebSocket setup for personal chats
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const chatConnections = new Map<string, Set<ExtendedWebSocket>>();
  const userSessions = new Map<string, any>();

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    const extendedWs = ws as ExtendedWebSocket;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle personal chat messages
        if (message.type === 'join') {
          extendedWs.meetingId = message.chatId;
          extendedWs.userId = message.user.id;
          
          userSessions.set(message.user.id, message.user);
          
          if (!chatConnections.has(message.chatId)) {
            chatConnections.set(message.chatId, new Set());
          }
          chatConnections.get(message.chatId)!.add(extendedWs);
          
          // Broadcast user joined to other participants
          broadcastToChat(message.chatId, {
            type: 'user_joined',
            user: message.user
          }, extendedWs);
          return;
        }
        
        if (message.type === 'message' && extendedWs.meetingId) {
          // Store message in JSON storage
          try {
            const messageData = {
              meetingId: extendedWs.meetingId,
              senderId: extendedWs.userId || 'anonymous',
              senderName: message.senderName || 'مستخدم مجهول',
              senderAvatar: message.senderAvatar,
              message: message.message,
              isFromRealUser: true,
              isSystemMessage: false
            };
            
            await jsonStorage.addMessage(messageData);
          } catch (error) {
            console.error('Failed to store message:', error);
          }
          
          // Broadcast to chat participants
          broadcastToChat(extendedWs.meetingId, {
            type: 'message',
            message: {
              id: Date.now().toString(),
              senderId: extendedWs.userId,
              senderName: message.senderName,
              senderAvatar: message.senderAvatar,
              message: message.message,
              timestamp: new Date(),
              isFromRealUser: true
            }
          });
          return;
        }

        if (message.type === 'webrtc_offer' || message.type === 'webrtc_answer' || message.type === 'webrtc_ice_candidate') {
          // Forward WebRTC signaling
          if (extendedWs.meetingId) {
            broadcastToChat(extendedWs.meetingId, message, extendedWs);
          }
          return;
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (extendedWs.meetingId && extendedWs.userId) {
        const chatSet = chatConnections.get(extendedWs.meetingId);
        if (chatSet) {
          chatSet.delete(extendedWs);
          if (chatSet.size === 0) {
            chatConnections.delete(extendedWs.meetingId);
          } else {
            // Broadcast user left
            broadcastToChat(extendedWs.meetingId, {
              type: 'user_left',
              userId: extendedWs.userId
            });
          }
        }
        
        userSessions.delete(extendedWs.userId);
      }
    });
  });

  function broadcastToChat(chatId: string, data: any, sender?: ExtendedWebSocket) {
    const chatSet = chatConnections.get(chatId);
    if (chatSet) {
      const messageStr = JSON.stringify(data);
      chatSet.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  return httpServer;
}