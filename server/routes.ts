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
      
      const household = await storage.getHouseholdByInviteCode(inviteCode);
      if (!household) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      const member = await storage.joinHousehold(household.id, userId);
      res.json({ household, member });
    } catch (error) {
      console.error("Error joining household:", error);
      res.status(500).json({ message: "Failed to join household" });
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
      
      const data = insertChoreSchema.parse(req.body);
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
      
      const chore = await storage.updateChore(id, updates);
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
      const validatedExpense = insertExpenseSchema.parse(expenseData);
      
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
      
      const data = insertCalendarEventSchema.parse(req.body);
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

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'send_message') {
          const { content, householdId, userId, linkedTo, linkedType } = message;
          
          const newMessage = await storage.createMessage({
            content,
            householdId,
            userId,
            linkedTo,
            linkedType,
          });
          
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: newMessage,
              }));
            }
          });
        }
        
        if (message.type === 'chore_update') {
          // Broadcast chore updates
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chore_updated',
                chore: message.chore,
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  return httpServer;
}
