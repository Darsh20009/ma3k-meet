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
      const meetings = await jsonStorage.getActiveMeetings();
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
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meeting" });
    }
  });

  // Join meeting with code and optional password
  app.post("/api/meetings/join", async (req, res) => {
    try {
      const { meetingCode, password, userName } = req.body;
      
      if (!meetingCode || !userName) {
        return res.status(400).json({ error: "Meeting code and user name are required" });
      }

      const meeting = await jsonStorage.getMeetingByCode(meetingCode);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      if (meeting.isPasswordProtected && meeting.password !== password) {
        return res.status(403).json({ error: "Incorrect password" });
      }

      // Check if meeting is at capacity
      const participants = await jsonStorage.getParticipants(meeting.id);
      const realUsers = await jsonStorage.getRealUsers(meeting.id);
      const totalCount = participants.length + realUsers.length;
      
      if (totalCount >= (meeting.maxParticipants || 100)) {
        return res.status(423).json({ error: "Meeting is at capacity" });
      }

      res.json({ 
        meeting, 
        canJoin: true, 
        message: "Access granted" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to join meeting" });
    }
  });

  // Verify meeting password
  app.post("/api/meetings/:id/verify-password", async (req, res) => {
    try {
      const { password } = req.body;
      const meeting = await jsonStorage.getMeeting(req.params.id);
      
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      if (meeting.isPasswordProtected && meeting.password !== password) {
        return res.status(403).json({ error: "Incorrect password" });
      }

      res.json({ verified: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify password" });
    }
  });

  // Enhanced session management
  app.get("/api/meetings/:id/session-users", async (req, res) => {
    try {
      const users = await jsonStorage.getActiveMeetingUsers(req.params.id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session users" });
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
      
      // Add user to meeting session
      if (userData.meetingId && user.id) {
        await jsonStorage.addUserToMeeting(userData.meetingId, user.id, userData.name);
      }
      
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
      // Get all users to find the one being deleted
      const allUsers = await jsonStorage.getRealUsers('');
      const userToDelete = allUsers.find(u => u.id === req.params.id);
      
      const success = await jsonStorage.removeRealUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove from session if user existed
      if (userToDelete && userToDelete.meetingId) {
        await jsonStorage.removeUserFromMeeting(userToDelete.meetingId, req.params.id);
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
        
        if (message.type === 'leave') {
          if (extendedWs.meetingId && extendedWs.userId) {
            broadcastToChat(extendedWs.meetingId, {
              type: 'user_left',
              userId: extendedWs.userId
            }, extendedWs);
            
            const chatConns = chatConnections.get(extendedWs.meetingId);
            if (chatConns) {
              chatConns.delete(extendedWs);
              if (chatConns.size === 0) {
                chatConnections.delete(extendedWs.meetingId);
              }
            }
            userSessions.delete(extendedWs.userId);
          }
          return;
        }
        
        if (message.type === 'message') {
          if (extendedWs.meetingId && message.message) {
            broadcastToChat(extendedWs.meetingId, {
              type: 'message',
              message: message.message
            });
          }
          return;
        }
        
        // Original meeting functionality
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
  
  // Broadcast function for personal chats
  function broadcastToChat(chatId: string, message: any, excludeWs?: ExtendedWebSocket) {
    const chatConns = chatConnections.get(chatId);
    if (chatConns) {
      chatConns.forEach((clientWs) => {
        if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(message));
        }
      });
    }
  }

  return httpServer;
}
