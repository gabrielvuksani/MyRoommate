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
  insertRoommateListingSchema,
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
      
      // Check if user is already a member of ANY household (leave first)
      const existingMembership = await storage.getUserHousehold(userId);
      if (existingMembership) {
        if (existingMembership.household.id === household.id) {
          return res.status(400).json({ message: "You are already a member of this household" });
        }
        // Leave current household before joining new one
        await storage.leaveHousehold(userId);
        console.log("User left previous household before joining new one");
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

  app.delete('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify user has access to delete this expense
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      await storage.deleteExpense(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
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

  app.delete('/api/calendar-events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify user has access to delete this calendar event
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      await storage.deleteCalendarEvent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Message routes - Optimized for real-time performance
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      // Add cache headers for optimal performance
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getMessages(membership.household.id, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, householdId } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Verify user is member of the household
      const membership = await storage.getUserHousehold(userId);
      if (!membership || membership.household.id !== householdId) {
        return res.status(403).json({ message: "Not authorized to send message to this household" });
      }
      
      const messageData = {
        content: content.trim(),
        householdId,
        userId,
        type: 'text'
      };
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
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

  // Roommate listing routes
  app.get('/api/roommate-listings', async (req: any, res) => {
    try {
      const { city, featured } = req.query;
      const listings = await storage.getRoommateListings(
        city ? String(city) : undefined,
        featured ? featured === 'true' : undefined
      );
      res.json(listings);
    } catch (error) {
      console.error("Error fetching roommate listings:", error);
      res.status(500).json({ message: "Failed to fetch roommate listings" });
    }
  });

  // Create demo listing (no auth required for demo)
  app.post('/api/roommate-listings/demo', async (req: any, res) => {
    try {
      // Check if demo listing already exists
      const existingListings = await storage.getRoommateListings();
      if (existingListings.length > 0) {
        return res.json(existingListings[0]);
      }

      const demoListing = await storage.createRoommateListing({
        title: "Sunny Room in Modern Downtown Apartment",
        description: "Beautiful, spacious room available in a newly renovated 3-bedroom apartment in the heart of downtown. The apartment features a modern kitchen with stainless steel appliances, hardwood floors throughout, and floor-to-ceiling windows with stunning city views. Perfect for young professionals or students looking for a vibrant living experience.",
        rent: 1200,
        location: "123 Main Street, Apt 4B",
        city: "San Francisco",
        availableFrom: new Date("2025-02-01"),
        roomType: "private",
        housingType: "apartment",
        preferences: "Looking for a clean, respectful roommate who values a quiet home environment. Non-smoker preferred. We have a friendly cat, so must be pet-friendly!",
        amenities: ["In-unit laundry", "Gym", "Rooftop deck", "High-speed WiFi", "Central AC/Heating", "Dishwasher", "Parking available"],
        images: [],
        contactInfo: "Please reach out through the app messaging system",
        featured: true,
        createdBy: null,
      });
      
      res.json(demoListing);
    } catch (error) {
      console.error("Error creating demo listing:", error);
      res.status(500).json({ message: "Failed to create demo listing" });
    }
  });

  app.post('/api/roommate-listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertRoommateListingSchema.parse(req.body);
      
      const listing = await storage.createRoommateListing({
        ...data,
        createdBy: userId,
      });
      
      res.json(listing);
    } catch (error) {
      console.error("Error creating roommate listing:", error);
      res.status(500).json({ message: "Failed to create roommate listing" });
    }
  });

  app.get('/api/roommate-listings/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listings = await storage.getUserRoommateListings(userId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user's roommate listings:", error);
      res.status(500).json({ message: "Failed to fetch your roommate listings" });
    }
  });

  app.get('/api/roommate-listings/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const listing = await storage.getRoommateListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching roommate listing:", error);
      res.status(500).json({ message: "Failed to fetch roommate listing" });
    }
  });

  app.patch('/api/roommate-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const listing = await storage.updateRoommateListing(id, updates);
      res.json(listing);
    } catch (error) {
      console.error("Error updating roommate listing:", error);
      res.status(500).json({ message: "Failed to update roommate listing" });
    }
  });

  app.delete('/api/roommate-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRoommateListing(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting roommate listing:", error);
      res.status(500).json({ message: "Failed to delete roommate listing" });
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
  
  console.log('WebSocket server initialized on path /ws');
  
  wss.on('connection', (ws: any) => {
    console.log('New WebSocket connection established');
    let userId: string | null = null;
    let householdId: string | null = null;
    
    ws.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Cache user info on first connection
        if (message.type === 'connect' && message.userId && message.householdId) {
          console.log(`WebSocket connect: userId=${message.userId}, householdId=${message.householdId}`);
          userId = message.userId;
          householdId = message.householdId;
          if (userId && householdId) {
            clientsById.set(userId, ws);
            
            // Store client metadata for targeted broadcasting
            (ws as any)._userId = userId;
            (ws as any)._householdId = householdId;
            
            // Add to household client set for fast broadcasting
            if (!householdClients.has(householdId)) {
              householdClients.set(householdId, new Set());
            }
            const householdSet = householdClients.get(householdId);
            if (householdSet) {
              householdSet.add(ws);
            }
            
            // Cache user data for fast message creation
            if (!userCache.has(userId)) {
              try {
                const user = await storage.getUser(userId);
                if (user) {
                  userCache.set(userId, user);
                  console.log(`User cached: ${userId}`);
                }
              } catch (error) {
                console.error(`Error caching user ${userId}:`, error);
              }
            }
          }
          
          // Send connection confirmation
          ws.send(JSON.stringify({
            type: 'connection_confirmed',
            userId,
            householdId
          }));
        }
        
        if (message.type === 'send_message') {
          const startTime = Date.now();
          const { content, householdId: msgHouseholdId, userId: msgUserId, linkedTo, linkedType, tempId } = message;
          
          try {
            // Get cached user for ultra-fast message creation
            const cachedUser = userCache.get(msgUserId);
            
            // Create message in database
            const newMessage = await storage.createMessage({
              content,
              householdId: msgHouseholdId,
              userId: msgUserId,
              linkedTo,
              linkedType,
            }, cachedUser);
            
            console.log(`Message created in ${Date.now() - startTime}ms:`, newMessage.id);
            
            // Immediate broadcast to all household clients for real-time sync
            const householdClientSet = householdClients.get(msgHouseholdId);
            if (householdClientSet) {
              const broadcastData = JSON.stringify({
                type: 'new_message',
                message: newMessage,
                tempId: tempId, // Include temp ID for optimistic update replacement
                timestamp: Date.now()
              });
              
              // Broadcast with immediate delivery and connection cleanup
              const deadConnections = new Set();
              let successfulBroadcasts = 0;
              
              householdClientSet.forEach((client: any) => {
                try {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(broadcastData);
                    successfulBroadcasts++;
                  } else {
                    deadConnections.add(client);
                  }
                } catch (error) {
                  console.error('Broadcast error:', error);
                  deadConnections.add(client);
                }
              });
              
              // Cleanup dead connections
              deadConnections.forEach((conn: any) => {
                householdClientSet.delete(conn);
                // Also remove from clientsById if it exists
                for (const [id, client] of Array.from(clientsById.entries())) {
                  if (client === conn) {
                    clientsById.delete(id);
                    break;
                  }
                }
              });
              
              console.log(`Broadcasted to ${successfulBroadcasts} clients, cleaned ${deadConnections.size} dead connections`);
            }
            
            // Performance tracking
            messageCount++;
            const processingTime = Date.now() - startTime;
            totalProcessingTime += processingTime;
            
            // Log performance every 5 messages for real-time monitoring
            if (messageCount % 5 === 0) {
              console.log(`Real-time Performance: ${messageCount} messages, avg ${(totalProcessingTime/messageCount).toFixed(1)}ms, last: ${processingTime}ms`);
            }
            
          } catch (error) {
            console.error('Message processing error:', error);
            // Send error back to sender with temp ID for cleanup
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'message_error',
                error: 'Failed to send message',
                tempId: tempId
              }));
            }
          }
        }
        
        // Handle ping/pong for connection keepalive
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
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
      console.log('WebSocket client disconnected', { userId, householdId });
      
      // Comprehensive cleanup for production stability
      if (userId) {
        clientsById.delete(userId);
      }
      
      // Remove from household client set with error handling
      if (householdId) {
        const householdSet = householdClients.get(householdId);
        if (householdSet) {
          householdSet.delete(ws);
          if (householdSet.size === 0) {
            householdClients.delete(householdId);
          }
        }
      }
    });
  });

  return httpServer;
}
