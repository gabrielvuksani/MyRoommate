import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import webpush from "web-push";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
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

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:notifications@myroommate.app',
  'BNUBRCnltmYiEEVwd8KD4lVRp8EJgfuI19XNJD2lki87bZZ6IIrAxWo6u6WjXq3h8FIs6b1RYGX6i33DEZmKNZ0', // Public key
  '8gDdfS0YP9m2JCg7RY9aDsTKCP6iLp0BNsRWch9BJAA' // Private key
);

// Store push subscriptions in memory (in production, use database)
const pushSubscriptions = new Map<string, any>(); // userId -> subscription

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes are now handled in setupAuth function

  // User profile routes
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
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
      const userId = req.user.id;
      const data = insertHouseholdSchema.parse(req.body);
      
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const household = await storage.createHousehold({
        ...data,
        inviteCode,
        createdBy: userId,
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      await storage.leaveHousehold(userId);
      res.json({ message: "Successfully left household" });
    } catch (error) {
      console.error("Error leaving household:", error);
      res.status(500).json({ message: "Failed to leave household" });
    }
  });

  app.patch('/api/households/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      
      // Real-time broadcast for chore assignment
      const householdClientSet = householdClients.get(membership.household.id);
      if (householdClientSet) {
        const broadcastData = JSON.stringify({
          type: 'new_chore',
          chore: chore,
          timestamp: Date.now()
        });
        
        householdClientSet.forEach((client: any) => {
          try {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          } catch (error) {
            console.error('Chore broadcast error:', error);
          }
        });
      }

      // Send push notification for chore assignment (background notifications)
      if (chore.assignedTo) {
        const pushPayload = {
          title: '📝 New Chore Assigned',
          body: `You've been assigned: ${chore.title}`,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: 'chore-assignment',
          data: {
            type: 'chore',
            choreId: chore.id,
            url: '/chores'
          }
        };
        
        sendPushNotification(chore.assignedTo, pushPayload)
          .catch(error => {
            // Silent fail for push notifications
          });
      }
      
      res.json(chore);
    } catch (error) {
      console.error("Error creating chore:", error);
      res.status(500).json({ message: "Failed to create chore" });
    }
  });

  app.patch('/api/chores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

      // Send push notification for chore completion
      if (processedUpdates.status === 'done' || processedUpdates.completedAt) {
        const membership = await storage.getUserHousehold(userId);
        if (membership) {
          const householdMembers = await storage.getHouseholdMembers(membership.household.id);
          const completer = await storage.getUser(userId);
          const completerName = completer ? `${completer.firstName || 'Someone'}` : 'Someone';
          
          const pushPayload = {
            title: '✅ Chore Completed',
            body: `${completerName} completed: ${chore.title}`,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: 'chore-completed',
            data: {
              type: 'chore',
              choreId: chore.id,
              url: '/chores'
            }
          };

          for (const member of householdMembers) {
            if (member.userId !== userId) { // Don't notify the completer
              sendPushNotification(member.userId, pushPayload)
                .catch(error => {
                  // Silent fail for push notifications
                });
            }
          }
        }
      }

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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      
      // Real-time broadcast for new expense
      const householdClientSet = householdClients.get(membership.household.id);
      if (householdClientSet) {
        const broadcastData = JSON.stringify({
          type: 'new_expense',
          expense: expense,
          timestamp: Date.now()
        });
        
        householdClientSet.forEach((client: any) => {
          try {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          } catch (error) {
            console.error('Expense broadcast error:', error);
          }
        });
      }

      // Send push notifications to all household members except the creator (background notifications)
      const householdMembers = await storage.getHouseholdMembers(membership.household.id);
      const pushPayload = {
        title: '💰 New Expense Added',
        body: `${validatedExpense.title} - $${validatedExpense.amount}`,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'new-expense',
        data: {
          type: 'expense',
          expenseId: expense.id,
          url: '/expenses'
        }
      };

      for (const member of householdMembers) {
        if (member.userId !== userId) { // Don't notify the creator
          sendPushNotification(member.userId, pushPayload)
            .catch(error => {
              // Silent fail for push notifications
            });
        }
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.delete('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      
      // Real-time broadcast for new calendar event
      const householdClientSet = householdClients.get(membership.household.id);
      if (householdClientSet) {
        const broadcastData = JSON.stringify({
          type: 'new_calendar_event',
          event: event,
          timestamp: Date.now()
        });
        
        householdClientSet.forEach((client: any) => {
          try {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          } catch (error) {
            console.error('Calendar event broadcast error:', error);
          }
        });
      }

      // Send push notifications to all household members except the creator (background notifications)
      const householdMembers = await storage.getHouseholdMembers(membership.household.id);
      const eventDate = new Date(data.startDate).toLocaleDateString();
      const pushPayload = {
        title: '📅 New Calendar Event',
        body: `${data.title} on ${eventDate}`,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'calendar-event',
        data: {
          type: 'calendar',
          eventId: event.id,
          url: '/calendar'
        }
      };

      for (const member of householdMembers) {
        if (member.userId !== userId) { // Don't notify the creator
          sendPushNotification(member.userId, pushPayload)
            .catch(error => {
              // Silent fail for push notifications
            });
        }
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.delete('/api/calendar-events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

      // Create a sample image as base64 data URL for demo purposes
      const createSampleImage = () => {
        const svgContent = `
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="400" height="300" fill="url(#bg)"/>
            <rect x="20" y="20" width="360" height="260" fill="rgba(255,255,255,0.1)" rx="12"/>
            <circle cx="200" cy="120" r="40" fill="rgba(255,255,255,0.2)"/>
            <rect x="160" y="140" width="80" height="6" fill="rgba(255,255,255,0.3)" rx="3"/>
            <rect x="170" y="155" width="60" height="4" fill="rgba(255,255,255,0.2)" rx="2"/>
            <text x="200" y="200" text-anchor="middle" font-family="system-ui" font-size="16" fill="white" opacity="0.8">Beautiful Modern Room</text>
            <text x="200" y="220" text-anchor="middle" font-family="system-ui" font-size="12" fill="white" opacity="0.6">Near UC Berkeley Campus</text>
          </svg>
        `;
        
        const base64 = btoa(svgContent);
        return `data:image/svg+xml;base64,${base64}`;
      };

      const demoListing = await storage.createRoommateListing({
        title: "Beautiful Modern Room in Shared House",
        description: "Spacious and bright room available in a beautifully maintained 4-bedroom house just minutes from UC Berkeley campus. The house features a modern kitchen with stainless steel appliances, comfortable living spaces, fast WiFi, and a lovely backyard perfect for studying or relaxing. You'll be sharing with 3 other friendly students who value both academics and social life. The room comes partially furnished with a bed, desk, and ample closet space. This is perfect for someone looking for a balance of privacy and community in their living situation.",
        rent: 1450,
        utilities: 125,
        location: "2847 Telegraph Avenue",
        city: "Berkeley",
        state: "CA",
        zipCode: "94705",
        university: "UC Berkeley",
        distanceToCampus: "8 minute walk",
        availableFrom: new Date("2025-08-15"),
        availableTo: new Date("2026-05-31"),
        roomType: "private",
        housingType: "house",
        genderPreference: "female",
        studentYear: "graduate",
        studyHabits: "quiet",
        socialPreferences: "balanced",
        lifestylePreferences: ["clean", "no_smoking", "vegetarian", "quiet"],
        amenities: [
          "High-speed WiFi",
          "In-unit laundry", 
          "Modern kitchen",
          "Backyard/garden",
          "Desk and chair",
          "Natural lighting",
          "Shared living spaces",
          "Near public transit",
          "Bike storage",
          "Study-friendly environment"
        ],
        images: [createSampleImage()],
        contactInfo: "sarah.berkeley.housing@gmail.com",
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
      const userId = req.user.id;
      const data = insertRoommateListingSchema.parse(req.body);
      
      // First, unfeature all existing listings
      await storage.unfeatueAllRoommateListings();
      
      // Create the new listing as featured
      const listing = await storage.createRoommateListing({
        ...data,
        createdBy: userId,
        featured: true, // Auto-feature the latest listing
      });
      
      res.json(listing);
    } catch (error) {
      console.error("Error creating roommate listing:", error);
      res.status(500).json({ message: "Failed to create roommate listing" });
    }
  });

  app.get('/api/roommate-listings/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Demo listing endpoint for university marketplace testing
  app.post('/api/roommate-listings/demo', async (req: any, res) => {
    try {
      const demoListing = {
        title: "Cozy Room Near UC Berkeley Campus",
        description: "Looking for a clean, responsible roommate to share a beautiful 2-bedroom apartment just 5 minutes walk from UC Berkeley campus. Perfect for students! The room is fully furnished with a comfortable bed, desk, and closet. Shared living room, kitchen, and bathroom are spacious and well-maintained.",
        rent: 950,
        utilities: 75,
        location: "2647 Telegraph Avenue",
        city: "Berkeley",
        university: "UC Berkeley",
        availableFrom: new Date('2025-08-01'),
        availableTo: new Date('2026-05-31'),
        roomType: "private" as const,
        housingType: "apartment" as const,
        genderPreference: "any" as const,
        studentYear: "any" as const,
        studyHabits: "quiet" as const,
        socialPreferences: "balanced" as const,
        lifestylePreferences: ["no_smoking", "pet_friendly", "clean"],
        amenities: ["WiFi", "Laundry", "Kitchen", "Near Campus", "Quiet", "Furnished"],
        contactInfo: "student.housing@berkeley.edu",
        images: [],
        isActive: true,
        featured: true,
        verified: true,
        userId: req.user?.id || '44253576'
      };

      const listing = await storage.createRoommateListing(demoListing);
      res.json(listing);
    } catch (error) {
      console.error("Error creating demo listing:", error);
      res.status(500).json({ message: "Failed to create demo listing" });
    }
  });

  // Push notification subscription endpoints
  app.post('/api/push/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = req.body;
      
      // Validate subscription format
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: 'Invalid subscription format' });
      }
      
      // Store subscription for this user with timestamp
      pushSubscriptions.set(userId, {
        ...subscription,
        timestamp: Date.now()
      });
      
      res.json({ success: true, message: 'Push subscription stored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to store push subscription' });
    }
  });

  app.delete('/api/push/unsubscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      pushSubscriptions.delete(userId);
      console.log(`Push subscription removed for user: ${userId}`);
      
      res.json({ success: true, message: 'Push subscription removed successfully' });
    } catch (error) {
      console.error('Error removing push subscription:', error);
      res.status(500).json({ message: 'Failed to remove push subscription' });
    }
  });

  // Push notification sending function with enhanced reliability
  async function sendPushNotification(userId: string, payload: any): Promise<boolean> {
    const subscription = pushSubscriptions.get(userId);
    
    if (!subscription) {
      return false;
    }

    // Send push notification with enhanced delivery settings
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload), {
        urgency: 'high',
        TTL: 86400, // 24 hours for maximum delivery window
        topic: undefined, // Allow all notifications through
        headers: {
          'Urgency': 'high',
          'Topic': payload.tag || 'instant'
        }
      });
      
      // Update subscription timestamp on successful send
      subscription.timestamp = Date.now();
      pushSubscriptions.set(userId, subscription);
      
      return true;
    } catch (error: any) {
      // If subscription is invalid/expired, remove it immediately
      if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 400) {
        pushSubscriptions.delete(userId);
      }
      return false;
    }
  }

  // Periodic subscription cleanup to remove stale subscriptions
  setInterval(() => {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    
    for (const [userId, subscription] of pushSubscriptions.entries()) {
      // Remove subscriptions older than 2 hours without activity
      if (subscription.timestamp && (now - subscription.timestamp) > TWO_HOURS) {
        pushSubscriptions.delete(userId);
      }
    }
  }, 60 * 60 * 1000); // Run every hour

  // Test push notification endpoint
  app.post('/api/push/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const testPayload = {
        title: '🧪 Test Notification',
        body: 'PWA push notifications are working! This notification works even when the app is closed.',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'test-notification',
        data: {
          type: 'test',
          url: '/'
        }
      };
      
      const sent = await sendPushNotification(userId, testPayload);
      
      if (sent) {
        res.json({ success: true, message: 'Test push notification sent successfully' });
      } else {
        res.status(400).json({ success: false, message: 'No push subscription found or failed to send' });
      }
    } catch (error) {
      console.error('Error sending test push notification:', error);
      res.status(500).json({ message: 'Failed to send test push notification' });
    }
  });

  // Developer Tools API - Delete All Data
  app.delete('/api/dev/delete-all-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // For security, only allow the current user's household data to be deleted
      const membership = await storage.getUserHousehold(userId);
      if (!membership) {
        return res.status(404).json({ message: "No household found" });
      }
      
      const householdId = membership.household.id;
      
      // Delete all data for the household using storage method
      await storage.deleteAllHouseholdData(householdId);
      
      console.log(`Deleted all data for household: ${householdId}`);
      res.json({ success: true, message: "All household data deleted successfully" });
    } catch (error) {
      console.error("Error deleting all data:", error);
      res.status(500).json({ message: "Failed to delete all data" });
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
  
  // WebSocket server initialized
  
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
                }
              } catch (error) {
                // Silent fail for user caching
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
        
        // Handle ping/pong for connection keepalive in deployment
        if (message.type === 'ping') {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
          } catch (error) {
            // Silent fail for ping/pong
          }
          return;
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
            
            // Message created successfully
            
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
              
              // Broadcast completed
            }

            // Send push notifications to all household members except the sender (background notifications)
            const householdMembers = await storage.getHouseholdMembers(msgHouseholdId);
            const senderName = cachedUser ? `${cachedUser.firstName || 'Someone'}` : 'Someone';
            const pushPayload = {
              title: `💬 ${senderName}`,
              body: content.length > 50 ? content.substring(0, 50) + '...' : content,
              icon: '/icon-192x192.png',
              badge: '/icon-72x72.png',
              tag: 'new-message',
              data: {
                type: 'message',
                messageId: newMessage.id,
                householdId: msgHouseholdId,
                url: '/messages'
              }
            };

            for (const member of householdMembers) {
              if (member.userId !== msgUserId) { // Don't notify the sender
                sendPushNotification(member.userId, pushPayload)
                  .catch(error => {
                    // Silent fail for push notifications
                  });
              }
            }
            
            // Performance tracking
            messageCount++;
            const processingTime = Date.now() - startTime;
            totalProcessingTime += processingTime;
            
            // Performance tracking complete
            
          } catch (error) {
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
        // Silent fail for WebSocket message errors
      }
    });
    
    ws.on('close', () => {
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
