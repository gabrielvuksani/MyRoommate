import {
  users,
  households,
  householdMembers,
  chores,
  expenses,
  expenseSplits,
  calendarEvents,
  messages,
  shoppingItems,
  roommateListings,
  pushSubscriptions,
  type User,
  type UpsertUser,
  type InsertUser,
  type Household,
  type InsertHousehold,
  type HouseholdMember,
  type Chore,
  type InsertChore,
  type Expense,
  type InsertExpense,
  type ExpenseSplit,
  type InsertExpenseSplit,
  type CalendarEvent,
  type InsertCalendarEvent,
  type Message,
  type InsertMessage,
  type ShoppingItem,
  type InsertShoppingItem,
  type RoommateListing,
  type InsertRoommateListing,
  type PushSubscription,
  type InsertPushSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserProfileImage(id: string, profileImageUrl: string | null): Promise<User | undefined>;
  
  // Household operations
  createHousehold(household: InsertHousehold & { inviteCode: string }): Promise<Household>;
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdByInviteCode(code: string): Promise<Household | undefined>;
  updateHousehold(id: string, updates: Partial<InsertHousehold>): Promise<Household>;
  joinHousehold(householdId: string, userId: string): Promise<HouseholdMember>;
  leaveHousehold(userId: string): Promise<void>;
  getHouseholdMembers(householdId: string): Promise<(HouseholdMember & { user: User })[]>;
  getUserHousehold(userId: string): Promise<(HouseholdMember & { household: Household }) | undefined>;
  
  // Chore operations
  createChore(chore: InsertChore): Promise<Chore>;
  getChores(householdId: string): Promise<(Chore & { assignedUser: User | null })[]>;
  updateChore(id: string, updates: Partial<InsertChore>): Promise<Chore>;
  deleteChore(id: string): Promise<void>;
  
  // Expense operations
  createExpense(expense: InsertExpense, splits: InsertExpenseSplit[]): Promise<Expense>;
  getExpenses(householdId: string): Promise<(Expense & { paidByUser: User; splits: (ExpenseSplit & { user: User })[] })[]>;
  updateExpenseSplit(id: string, settled: boolean): Promise<ExpenseSplit>;
  deleteExpense(id: string): Promise<void>;
  getUserBalance(householdId: string, userId: string): Promise<{ totalOwed: number; totalOwing: number }>;
  
  // Calendar operations
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvents(householdId: string, startDate?: Date, endDate?: Date): Promise<(CalendarEvent & { creator: User })[]>;
  updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage, user?: User): Promise<Message & { user: User }>;
  getMessages(householdId: string, limit?: number): Promise<(Message & { user: User })[]>;
  
  // Shopping operations
  createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  getShoppingItems(householdId: string): Promise<(ShoppingItem & { creator: User; completedByUser: User | null })[]>;
  updateShoppingItem(id: string, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem>;
  deleteShoppingItem(id: string): Promise<void>;
  
  // Roommate listing operations
  createRoommateListing(listing: InsertRoommateListing): Promise<RoommateListing>;
  getRoommateListings(city?: string, featured?: boolean): Promise<(RoommateListing & { creator: User })[]>;
  getRoommateListing(id: string): Promise<(RoommateListing & { creator: User }) | undefined>;
  updateRoommateListing(id: string, updates: Partial<InsertRoommateListing>): Promise<RoommateListing>;
  deleteRoommateListing(id: string): Promise<void>;
  getUserRoommateListings(userId: string): Promise<RoommateListing[]>;
  
  // Push subscription operations
  upsertPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
  deactivatePushSubscription(endpoint: string): Promise<void>;
  getUserPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getActivePushSubscriptions(householdId: string): Promise<(PushSubscription & { user: User })[]>;
  
  // Developer tools operations
  deleteAllHouseholdData(householdId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: User): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserProfileImage(id: string, profileImageUrl: string | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createHousehold(household: InsertHousehold & { inviteCode: string, createdBy: string }): Promise<Household> {
    const [created] = await db.insert(households).values(household).returning();
    return created;
  }

  async getHousehold(id: string): Promise<Household | undefined> {
    const [household] = await db.select().from(households).where(eq(households.id, id));
    return household;
  }

  async getHouseholdByInviteCode(code: string): Promise<Household | undefined> {
    console.log("Storage: Looking up household with invite code:", code);
    const [household] = await db.select().from(households).where(eq(households.inviteCode, code));
    console.log("Storage: Household found:", household ? `ID: ${household.id}, Name: ${household.name}` : "Not found");
    return household;
  }

  async updateHousehold(id: string, updates: Partial<InsertHousehold>): Promise<Household> {
    const [household] = await db
      .update(households)
      .set(updates)
      .where(eq(households.id, id))
      .returning();
    return household;
  }

  async joinHousehold(householdId: string, userId: string): Promise<HouseholdMember> {
    try {
      console.log("Attempting to join household:", { householdId, userId });
      
      const [member] = await db
        .insert(householdMembers)
        .values({ 
          householdId, 
          userId,
          role: 'member',
          joinedAt: new Date()
        })
        .returning();
      
      console.log("Successfully joined household:", member);
      return member;
    } catch (error) {
      console.error("Database error joining household:", error);
      throw error;
    }
  }

  async leaveHousehold(userId: string): Promise<void> {
    await db.delete(householdMembers).where(eq(householdMembers.userId, userId));
  }

  async getHouseholdMembers(householdId: string): Promise<(HouseholdMember & { user: User })[]> {
    const result = await db
      .select({
        id: householdMembers.id,
        householdId: householdMembers.householdId,
        userId: householdMembers.userId,
        role: householdMembers.role,
        joinedAt: householdMembers.joinedAt,
        user: users,
      })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(eq(householdMembers.householdId, householdId));

    return result;
  }

  async getUserHousehold(userId: string): Promise<(HouseholdMember & { household: Household }) | undefined> {
    const [result] = await db
      .select({
        id: householdMembers.id,
        householdId: householdMembers.householdId,
        userId: householdMembers.userId,
        role: householdMembers.role,
        joinedAt: householdMembers.joinedAt,
        household: households,
      })
      .from(householdMembers)
      .innerJoin(households, eq(householdMembers.householdId, households.id))
      .where(eq(householdMembers.userId, userId));

    return result;
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    const [created] = await db.insert(chores).values(chore).returning();
    return created;
  }

  async getChores(householdId: string): Promise<(Chore & { assignedUser: User | null })[]> {
    const result = await db
      .select({
        id: chores.id,
        householdId: chores.householdId,
        title: chores.title,
        description: chores.description,
        status: chores.status,
        assignedTo: chores.assignedTo,
        dueDate: chores.dueDate,
        recurrence: chores.recurrence,
        recurrenceInterval: chores.recurrenceInterval,
        streak: chores.streak,
        completedAt: chores.completedAt,
        createdAt: chores.createdAt,
        updatedAt: chores.updatedAt,
        assignedUser: users,
      })
      .from(chores)
      .leftJoin(users, eq(chores.assignedTo, users.id))
      .where(eq(chores.householdId, householdId))
      .orderBy(asc(chores.createdAt));

    return result;
  }

  async updateChore(id: string, updates: Partial<InsertChore>): Promise<Chore> {
    const [updated] = await db
      .update(chores)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chores.id, id))
      .returning();
    return updated;
  }

  async deleteChore(id: string): Promise<void> {
    await db.delete(chores).where(eq(chores.id, id));
  }

  async createExpense(expense: InsertExpense, splits: InsertExpenseSplit[]): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    
    if (splits.length > 0) {
      await db.insert(expenseSplits).values(
        splits.map(split => ({ ...split, expenseId: created.id }))
      );
    }
    
    return created;
  }

  async getExpenses(householdId: string): Promise<(Expense & { paidByUser: User; splits: (ExpenseSplit & { user: User })[] })[]> {
    const expenseResults = await db
      .select({
        id: expenses.id,
        householdId: expenses.householdId,
        title: expenses.title,
        amount: expenses.amount,
        paidBy: expenses.paidBy,
        category: expenses.category,
        splitType: expenses.splitType,
        receiptUrl: expenses.receiptUrl,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        paidByUser: users,
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidBy, users.id))
      .where(eq(expenses.householdId, householdId))
      .orderBy(desc(expenses.createdAt));

    const results = [];
    for (const expense of expenseResults) {
      const splits = await db
        .select({
          id: expenseSplits.id,
          expenseId: expenseSplits.expenseId,
          userId: expenseSplits.userId,
          amount: expenseSplits.amount,
          settled: expenseSplits.settled,
          settledAt: expenseSplits.settledAt,
          user: users,
        })
        .from(expenseSplits)
        .innerJoin(users, eq(expenseSplits.userId, users.id))
        .where(eq(expenseSplits.expenseId, expense.id));

      results.push({ ...expense, splits });
    }

    return results;
  }

  async updateExpenseSplit(id: string, settled: boolean): Promise<ExpenseSplit> {
    const [updated] = await db
      .update(expenseSplits)
      .set({ settled, settledAt: settled ? new Date() : null })
      .where(eq(expenseSplits.id, id))
      .returning();
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    // Delete all splits for this expense first (foreign key constraint)
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, id));
    // Then delete the expense itself
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getUserBalance(householdId: string, userId: string): Promise<{ totalOwed: number; totalOwing: number }> {
    // Amount owed to user (they paid, others owe them)
    const [owedResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenseSplits.amount}), 0)`,
      })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
      .where(
        and(
          eq(expenses.householdId, householdId),
          eq(expenses.paidBy, userId),
          eq(expenseSplits.settled, false),
          sql`${expenseSplits.userId} != ${userId}`
        )
      );

    // Amount user owes to others
    const [owingResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenseSplits.amount}), 0)`,
      })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
      .where(
        and(
          eq(expenses.householdId, householdId),
          eq(expenseSplits.userId, userId),
          eq(expenseSplits.settled, false),
          sql`${expenses.paidBy} != ${userId}`
        )
      );

    return {
      totalOwed: Number(owedResult.total) || 0,
      totalOwing: Number(owingResult.total) || 0,
    };
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [created] = await db.insert(calendarEvents).values(event).returning();
    return created;
  }

  async getCalendarEvents(householdId: string, startDate?: Date, endDate?: Date): Promise<(CalendarEvent & { creator: User })[]> {
    let query = db
      .select({
        id: calendarEvents.id,
        householdId: calendarEvents.householdId,
        title: calendarEvents.title,
        description: calendarEvents.description,
        startDate: calendarEvents.startDate,
        endDate: calendarEvents.endDate,
        color: calendarEvents.color,
        type: calendarEvents.type,
        createdBy: calendarEvents.createdBy,
        createdAt: calendarEvents.createdAt,
        creator: users,
      })
      .from(calendarEvents)
      .innerJoin(users, eq(calendarEvents.createdBy, users.id))
      .where(eq(calendarEvents.householdId, householdId))
      .orderBy(asc(calendarEvents.startDate));

    return await query;
  }

  async updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [updated] = await db
      .update(calendarEvents)
      .set(updates)
      .where(eq(calendarEvents.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  async createMessage(message: InsertMessage, user?: User): Promise<Message & { user: User }> {
    const [created] = await db.insert(messages).values(message).returning();
    
    // If user is provided (from cache), avoid database lookup
    if (user) {
      return {
        ...created,
        user,
      };
    }
    
    // Fallback to database lookup only if user not cached
    const [result] = await db
      .select({
        id: messages.id,
        householdId: messages.householdId,
        userId: messages.userId,
        content: messages.content,
        type: messages.type,
        linkedTo: messages.linkedTo,
        linkedType: messages.linkedType,
        createdAt: messages.createdAt,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, created.id));

    return result;
  }

  async getMessages(householdId: string, limit: number = 50): Promise<(Message & { user: User })[]> {
    // Optimized query with index hints and reduced data transfer
    const result = await db
      .select({
        id: messages.id,
        householdId: messages.householdId,
        userId: messages.userId,
        content: messages.content,
        type: messages.type,
        linkedTo: messages.linkedTo,
        linkedType: messages.linkedType,
        createdAt: messages.createdAt,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.householdId, householdId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result.reverse();
  }

  async createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    const [created] = await db.insert(shoppingItems).values(item).returning();
    return created;
  }

  async getShoppingItems(householdId: string): Promise<(ShoppingItem & { creator: User; completedByUser: User | null })[]> {
    const result = await db
      .select({
        id: shoppingItems.id,
        householdId: shoppingItems.householdId,
        name: shoppingItems.name,
        quantity: shoppingItems.quantity,
        completed: shoppingItems.completed,
        completedBy: shoppingItems.completedBy,
        completedAt: shoppingItems.completedAt,
        createdBy: shoppingItems.createdBy,
        createdAt: shoppingItems.createdAt,
        creator: sql<User>`creator`,
        completedByUser: sql<User | null>`completed_by_user`,
      })
      .from(shoppingItems)
      .innerJoin(sql`${users} as creator`, sql`${shoppingItems.createdBy} = creator.id`)
      .leftJoin(sql`${users} as completed_by_user`, sql`${shoppingItems.completedBy} = completed_by_user.id`)
      .where(eq(shoppingItems.householdId, householdId))
      .orderBy(asc(shoppingItems.completed), desc(shoppingItems.createdAt));

    return result;
  }

  async updateShoppingItem(id: string, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem> {
    const [updated] = await db
      .update(shoppingItems)
      .set(updates)
      .where(eq(shoppingItems.id, id))
      .returning();
    return updated;
  }

  async deleteShoppingItem(id: string): Promise<void> {
    await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
  }

  async unfeatueAllRoommateListings(): Promise<void> {
    await db
      .update(roommateListings)
      .set({ featured: false })
      .where(eq(roommateListings.featured, true));
  }

  async createRoommateListing(listing: InsertRoommateListing): Promise<RoommateListing> {
    const [created] = await db.insert(roommateListings).values(listing).returning();
    return created;
  }

  async getRoommateListings(city?: string, featured?: boolean): Promise<(RoommateListing & { creator: User })[]> {
    // No demo data insertion to avoid foreign key constraint issues

    const conditions = [eq(roommateListings.isActive, true)];
    
    if (city) {
      conditions.push(eq(roommateListings.location, city));
    }
    
    if (featured !== undefined) {
      conditions.push(eq(roommateListings.featured, featured));
    }

    const result = await db
      .select({
        id: roommateListings.id,
        title: roommateListings.title,
        description: roommateListings.description,
        rent: roommateListings.rent,
        utilities: roommateListings.utilities,
        location: roommateListings.location,
        city: roommateListings.city,
        state: roommateListings.state,
        zipCode: roommateListings.zipCode,
        university: roommateListings.university,
        distanceToCampus: roommateListings.distanceToCampus,
        availableFrom: roommateListings.availableFrom,
        availableTo: roommateListings.availableTo,
        roomType: roommateListings.roomType,
        housingType: roommateListings.housingType,
        amenities: roommateListings.amenities,
        lifestylePreferences: roommateListings.lifestylePreferences,
        genderPreference: roommateListings.genderPreference,
        studentYear: roommateListings.studentYear,
        studyHabits: roommateListings.studyHabits,
        socialPreferences: roommateListings.socialPreferences,
        images: roommateListings.images,
        contactInfo: roommateListings.contactInfo,
        isActive: roommateListings.isActive,
        featured: roommateListings.featured,
        verified: roommateListings.verified,
        createdBy: roommateListings.createdBy,
        createdAt: roommateListings.createdAt,
        updatedAt: roommateListings.updatedAt,
        creator: users,
      })
      .from(roommateListings)
      .leftJoin(users, eq(roommateListings.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(roommateListings.featured), desc(roommateListings.createdAt));
    
    return result.map(row => ({
      ...row,
      creator: row.creator || {
        id: "unknown",
        email: "contact@email.com",
        password: "",
        firstName: "Anonymous",
        lastName: "User",
        profileImageUrl: null,
        profileColor: "blue",
        verified: false,
        verificationToken: null,
        phoneNumber: null,
        dateOfBirth: null,
        idVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }));
  }

  async getRoommateListing(id: string): Promise<(RoommateListing & { creator: User }) | undefined> {
    const result = await db
      .select({
        id: roommateListings.id,
        title: roommateListings.title,
        description: roommateListings.description,
        rent: roommateListings.rent,
        utilities: roommateListings.utilities,
        location: roommateListings.location,
        city: roommateListings.city,
        state: roommateListings.state,
        zipCode: roommateListings.zipCode,
        university: roommateListings.university,
        distanceToCampus: roommateListings.distanceToCampus,
        availableFrom: roommateListings.availableFrom,
        availableTo: roommateListings.availableTo,
        roomType: roommateListings.roomType,
        housingType: roommateListings.housingType,
        amenities: roommateListings.amenities,
        lifestylePreferences: roommateListings.lifestylePreferences,
        genderPreference: roommateListings.genderPreference,
        studentYear: roommateListings.studentYear,
        studyHabits: roommateListings.studyHabits,
        socialPreferences: roommateListings.socialPreferences,
        images: roommateListings.images,
        contactInfo: roommateListings.contactInfo,
        isActive: roommateListings.isActive,
        featured: roommateListings.featured,
        verified: roommateListings.verified,
        createdBy: roommateListings.createdBy,
        createdAt: roommateListings.createdAt,
        updatedAt: roommateListings.updatedAt,
        creator: users,
      })
      .from(roommateListings)
      .leftJoin(users, eq(roommateListings.createdBy, users.id))
      .where(eq(roommateListings.id, id))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row,
      creator: row.creator || {
        id: "unknown",
        email: "unknown@example.com",
        password: "",
        firstName: "Anonymous",
        lastName: "User",
        profileImageUrl: null,
        profileColor: "blue",
        verified: false,
        verificationToken: null,
        phoneNumber: null,
        dateOfBirth: null,
        idVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    };
  }

  async updateRoommateListing(id: string, updates: Partial<InsertRoommateListing>): Promise<RoommateListing> {
    const [updated] = await db
      .update(roommateListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roommateListings.id, id))
      .returning();
    return updated;
  }

  async deleteRoommateListing(id: string): Promise<void> {
    await db.delete(roommateListings).where(eq(roommateListings.id, id));
  }

  async getUserRoommateListings(userId: string): Promise<RoommateListing[]> {
    const result = await db
      .select()
      .from(roommateListings)
      .where(eq(roommateListings.createdBy, userId))
      .orderBy(desc(roommateListings.createdAt));
    return result;
  }

  async updateRoommateListingImages(id: string, imageUrls: string[]): Promise<RoommateListing> {
    const [updated] = await db
      .update(roommateListings)
      .set({ 
        images: imageUrls,
        updatedAt: new Date() 
      })
      .where(eq(roommateListings.id, id))
      .returning();
    return updated;
  }

  // Push subscription operations
  async upsertPushSubscription(subscription: any): Promise<any> {
    try {
      // Extract keys from subscription
      const p256dhKey = subscription.keys?.p256dh || subscription.keys?.p256dhKey;
      const authKey = subscription.keys?.auth || subscription.keys?.authKey;
      
      console.log('upsertPushSubscription called with:', {
        userId: subscription.userId,
        endpoint: subscription.endpoint,
        p256dhKey: p256dhKey ? 'present' : 'missing',
        authKey: authKey ? 'present' : 'missing'
      });
      
      if (!subscription.userId || !subscription.endpoint || !p256dhKey || !authKey) {
        throw new Error('Missing required subscription fields');
      }
      
      // Using raw query to match actual database schema
      const result = await db.execute(sql`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, is_active, created_at)
        VALUES (${subscription.userId}, ${subscription.endpoint}, ${p256dhKey}, ${authKey}, true, NOW())
        ON CONFLICT (endpoint) 
        DO UPDATE SET 
          user_id = ${subscription.userId},
          p256dh_key = ${p256dhKey},
          auth_key = ${authKey},
          is_active = true
        RETURNING *
      `);
      
      console.log('Push subscription upserted successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in upsertPushSubscription:', error);
      throw error;
    }
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db.execute(sql`
      DELETE FROM push_subscriptions 
      WHERE user_id = ${userId} AND endpoint = ${endpoint}
    `);
  }

  async deactivatePushSubscription(endpoint: string): Promise<void> {
    await db.execute(sql`
      UPDATE push_subscriptions 
      SET is_active = false 
      WHERE endpoint = ${endpoint}
    `);
  }

  async getUserPushSubscriptions(userId: string): Promise<any[]> {
    // Using raw query to match actual database schema
    const result = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        endpoint,
        p256dh_key,
        auth_key,
        created_at as "createdAt",
        is_active as "active"
      FROM push_subscriptions
      WHERE user_id = ${userId}
        AND is_active = true
      ORDER BY created_at DESC
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh_key,
        auth: row.auth_key
      },
      active: row.active,
      createdAt: row.createdAt
    }));
  }

  async getActivePushSubscriptions(householdId: string): Promise<any[]> {
    // Using raw query to match actual database schema
    const result = await db.execute(sql`
      SELECT 
        ps.id,
        ps.user_id as "userId",
        ps.endpoint,
        ps.p256dh_key,
        ps.auth_key,
        ps.created_at as "createdAt",
        ps.is_active as "active",
        u.id as "user_id",
        u.email as "user_email",
        u.first_name as "user_firstName",
        u.last_name as "user_lastName"
      FROM push_subscriptions ps
      INNER JOIN users u ON ps.user_id = u.id
      INNER JOIN household_members hm ON u.id = hm.user_id
      WHERE hm.household_id = ${householdId}
        AND ps.is_active = true
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh_key,
        auth: row.auth_key
      },
      active: row.active,
      createdAt: row.createdAt,
      user: {
        id: row.user_id,
        email: row.user_email,
        firstName: row.user_firstName,
        lastName: row.user_lastName
      }
    }));
  }

  async deleteAllHouseholdData(householdId: string): Promise<void> {
    console.log(`Deleting all household data except roommate listings for household: ${householdId}`);
    
    // Delete in the correct order to respect foreign key constraints
    // NOTE: Roommate listings are preserved as they're not household-specific
    
    // 1. Delete expense splits (references expenses)
    const expenseIds = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.householdId, householdId));
    
    if (expenseIds.length > 0) {
      await db.delete(expenseSplits).where(
        sql`expense_id IN (${sql.join(expenseIds.map(e => sql`${e.id}`), sql`, `)})`
      );
    }
    
    // 2. Delete other household data (preserving roommate listings)
    await db.delete(messages).where(eq(messages.householdId, householdId));
    await db.delete(expenses).where(eq(expenses.householdId, householdId));
    await db.delete(chores).where(eq(chores.householdId, householdId));
    await db.delete(calendarEvents).where(eq(calendarEvents.householdId, householdId));
    await db.delete(shoppingItems).where(eq(shoppingItems.householdId, householdId));
    
    // 3. Delete household members
    await db.delete(householdMembers).where(eq(householdMembers.householdId, householdId));
    
    // 4. Finally delete the household itself
    await db.delete(households).where(eq(households.id, householdId));
    
    console.log(`Successfully deleted all household data (roommate listings preserved) for household: ${householdId}`);
  }
}

export const storage = new DatabaseStorage();
