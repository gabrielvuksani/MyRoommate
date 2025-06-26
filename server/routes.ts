import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertHouseholdSchema,
  insertChoreSchema,
  insertExpenseSchema,
  insertCalendarEventSchema,
  insertMessageSchema,
  insertShoppingItemSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Household routes
  app.post('/api/households', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertHouseholdSchema.parse(req.body);
      
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const household = await storage.createHousehold({
        ...data,
        inviteCode,
      });
      
      // Add creator as admin
      await storage.joinHousehold(household.id, userId);
      
      res.json(household);
    } catch (error) {
      console.error("Error creating household:", error);
      res.status(500).json({ message: "Failed to create household" });
    }
  });

  app.post('/api/households/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inviteCode } = req.body;
      
      console.log("Join household attempt:", { userId, inviteCode, codeLength: inviteCode?.length });
      
      if (!inviteCode || inviteCode.trim().length === 0) {
        return res.status(400).json({ message: "Invite code is required" });
      }
      
      const household = await storage.getHouseholdByInviteCode(inviteCode.trim().toUpperCase());
      console.log("Household lookup result:", household ? `Found: ${household.name}` : "Not found");
      
      if (!household) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      // Check if user is already a member
      const existingMembership = await storage.getUserHousehold(userId);
      if (existingMembership && existingMembership.household.id === household.id) {
        return res.status(400).json({ message: "You are already a member of this household" });
      }
      
      const member = await storage.joinHousehold(household.id, userId);
      res.json({ household, member });
    } catch (error) {
      console.error("Error joining household:", error);
      res.status(500).json({ message: "Failed to join household" });
    }
  });

  app.post('/api/households/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leaveHousehold(userId);
      res.json({ message: "Successfully left household" });
    } catch (error) {
      console.error("Error leaving household:", error);
      res.status(500).json({ message: "Failed to leave household" });
    }
  });

  app.patch('/api/households/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Household name is required" });
      }
      
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const updatedHousehold = await storage.updateHousehold(membership.household.id, { name: name.trim() });
      res.json(updatedHousehold);
    } catch (error) {
      console.error("Error updating household:", error);
      res.status(500).json({ message: "Failed to update household" });
    }
  });

  app.get('/api/households/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const members = await storage.getHouseholdMembers(membership.household.id);
      res.json({ ...membership.household, members });
    } catch (error) {
      console.error("Error fetching household:", error);
      res.status(500).json({ message: "Failed to fetch household" });
    }
  });

  // Chore routes
  app.get('/api/chores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const chores = await storage.getChores(membership.household.id);
      res.json(chores);
    } catch (error) {
      console.error("Error fetching chores:", error);
      res.status(500).json({ message: "Failed to fetch chores" });
    }
  });

  app.post('/api/chores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const { dueDate, ...rest } = req.body;
      const data = insertChoreSchema.parse({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
      });
      const chore = await storage.createChore({
        ...data,
        householdId: membership.household.id,
      });
      
      res.json(chore);
    } catch (error) {
      console.error("Error creating chore:", error);
      res.status(500).json({ message: "Failed to create chore" });
    }
  });

  app.patch('/api/chores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Handle date fields properly
      const processedUpdates = { ...updates };
      if (processedUpdates.completedAt && typeof processedUpdates.completedAt === 'string') {
        processedUpdates.completedAt = new Date(processedUpdates.completedAt);
      }
      if (processedUpdates.dueDate && typeof processedUpdates.dueDate === 'string') {
        processedUpdates.dueDate = new Date(processedUpdates.dueDate);
      }
      
      const chore = await storage.updateChore(id, processedUpdates);
      res.json(chore);
    } catch (error) {
      console.error("Error updating chore:", error);
      res.status(500).json({ message: "Failed to update chore" });
    }
  });

  app.delete('/api/chores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChore(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chore:", error);
      res.status(500).json({ message: "Failed to delete chore" });
    }
  });

  // Expense routes
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const expenses = await storage.getExpenses(membership.household.id);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const { expense: expenseData, splits } = req.body;
      const validatedExpense = insertExpenseSchema.parse({
        ...expenseData,
        amount: expenseData.amount.toString(),
      });
      
      const expense = await storage.createExpense(
        {
          ...validatedExpense,
          householdId: membership.household.id,
          paidBy: userId,
        },
        splits
      );
      
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch('/api/expense-splits/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const splitId = req.params.id;
      const { settled } = req.body;
      
      // Verify user has access to this expense split
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const updatedSplit = await storage.updateExpenseSplit(splitId, settled);
      res.json(updatedSplit);
    } catch (error) {
      console.error("Error updating expense split:", error);
      res.status(500).json({ message: "Failed to update expense split" });
    }
  });

  app.get('/api/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const balance = await storage.getUserBalance(membership.household.id, userId);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Calendar routes
  app.get('/api/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const events = await storage.getCalendarEvents(membership.household.id);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post('/api/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const { startDate, endDate, ...rest } = req.body;
      const data = insertCalendarEventSchema.parse({
        ...rest,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      });
      const event = await storage.createCalendarEvent({
        ...data,
        householdId: membership.household.id,
        createdBy: userId,
      });
      
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const messages = await storage.getMessages(membership.household.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Shopping routes
  app.get('/api/shopping', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const items = await storage.getShoppingItems(membership.household.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      res.status(500).json({ message: "Failed to fetch shopping items" });
    }
  });

  app.post('/api/shopping', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const data = insertShoppingItemSchema.parse(req.body);
      const item = await storage.createShoppingItem({
        ...data,
        householdId: membership.household.id,
        createdBy: userId,
      });
      
      res.json(item);
    } catch (error) {
      console.error("Error creating shopping item:", error);
      res.status(500).json({ message: "Failed to create shopping item" });
    }
  });

  app.patch('/api/shopping/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const item = await storage.updateShoppingItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating shopping item:", error);
      res.status(500).json({ message: "Failed to update shopping item" });
    }
  });

  const httpServer = createServer(app);

  // High-performance WebSocket setup with user caching
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Performance optimization caches
  const userCache = new Map<string, any>();
  const clientsById = new Map<string, WebSocket>();
  const householdClients = new Map<string, Set<WebSocket>>();
  
  // Performance monitoring
  let messageCount = 0;
  let totalProcessingTime = 0;
  
  wss.on('connection', (ws: any) => {
    let userId: string | null = null;
    let householdId: string | null = null;
    
    ws.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Cache user info on first connection
        if (message.type === 'connect' && message.userId && message.householdId) {
          userId = message.userId;
          householdId = message.householdId;
          clientsById.set(userId, ws);
          
          // Store client metadata for targeted broadcasting
          (ws as any)._userId = userId;
          (ws as any)._householdId = householdId;
          
          // Add to household client set for fast broadcasting
          if (!householdClients.has(householdId)) {
            householdClients.set(householdId, new Set());
          }
          householdClients.get(householdId)?.add(ws);
          
          // Cache user data for fast message creation
          if (!userCache.has(userId)) {
            const user = await storage.getUser(userId);
            if (user) {
              userCache.set(userId, user);
            }
          }
        }
        
        if (message.type === 'send_message') {
          const startTime = Date.now();
          const { content, householdId: msgHouseholdId, userId: msgUserId, linkedTo, linkedType } = message;
          
          // Get cached user for ultra-fast message creation
          const cachedUser = userCache.get(msgUserId);
          
          const newMessage = await storage.createMessage({
            content,
            householdId: msgHouseholdId,
            userId: msgUserId,
            linkedTo,
            linkedType,
          }, cachedUser);
          
          // Optimized household-based broadcasting
          const householdClientSet = householdClients.get(msgHouseholdId);
          if (householdClientSet) {
            const broadcastData = JSON.stringify({
              type: 'new_message',
              message: newMessage,
            });
            
            householdClientSet.forEach((client: any) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastData);
              }
            });
          }
          
          // Performance tracking
          messageCount++;
          totalProcessingTime += Date.now() - startTime;
          if (messageCount % 10 === 0) {
            console.log(`💬 Chat Performance: ${messageCount} messages, avg ${(totalProcessingTime/messageCount).toFixed(2)}ms`);
          }
        }
        
        if (message.type === 'user_typing') {
          const { householdId: msgHouseholdId, userId: msgUserId, userName } = message;
          
          // Broadcast typing indicator only to other clients in same household
          const broadcastData = JSON.stringify({
            type: 'user_typing',
            householdId: msgHouseholdId,
            userId: msgUserId,
            userName,
          });
          
          wss.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN && 
                client._householdId === msgHouseholdId && 
                client._userId !== msgUserId) {
              client.send(broadcastData);
            }
          });
        }
        
        if (message.type === 'user_stopped_typing') {
          const { householdId: msgHouseholdId, userId: msgUserId, userName } = message;
          
          // Broadcast stop typing indicator only to other clients in same household
          const broadcastData = JSON.stringify({
            type: 'user_stopped_typing',
            householdId: msgHouseholdId,
            userId: msgUserId,
            userName,
          });
          
          wss.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN && 
                client._householdId === msgHouseholdId && 
                client._userId !== msgUserId) {
              client.send(broadcastData);
            }
          });
        }
        
        if (message.type === 'chore_update') {
          // Broadcast chore updates to household members only
          const broadcastData = JSON.stringify({
            type: 'chore_updated',
            chore: message.chore,
          });
          
          wss.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN && client._householdId === message.householdId) {
              client.send(broadcastData);
            }
          });
        }
        

        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        clientsById.delete(userId);
        
        // Remove from household client set
        if (householdId) {
          const householdSet = householdClients.get(householdId);
          if (householdSet) {
            householdSet.delete(ws);
            if (householdSet.size === 0) {
              householdClients.delete(householdId);
            }
          }
        }
      }
    });
  });

  return httpServer;
}
