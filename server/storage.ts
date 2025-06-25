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
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Household operations
  createHousehold(household: InsertHousehold & { inviteCode: string }): Promise<Household>;
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdByInviteCode(code: string): Promise<Household | undefined>;
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
  getUserBalance(householdId: string, userId: string): Promise<{ totalOwed: number; totalOwing: number }>;
  
  // Calendar operations
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvents(householdId: string, startDate?: Date, endDate?: Date): Promise<(CalendarEvent & { creator: User })[]>;
  updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message & { user: User }>;
  getMessages(householdId: string, limit?: number): Promise<(Message & { user: User })[]>;
  
  // Shopping operations
  createShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  getShoppingItems(householdId: string): Promise<(ShoppingItem & { creator: User; completedByUser: User | null })[]>;
  updateShoppingItem(id: string, updates: Partial<InsertShoppingItem>): Promise<ShoppingItem>;
  deleteShoppingItem(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  async createHousehold(household: InsertHousehold & { inviteCode: string }): Promise<Household> {
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

  async joinHousehold(householdId: string, userId: string): Promise<HouseholdMember> {
    const [member] = await db
      .insert(householdMembers)
      .values({ householdId, userId })
      .returning();
    return member;
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

  async createMessage(message: InsertMessage): Promise<Message & { user: User }> {
    const [created] = await db.insert(messages).values(message).returning();
    
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
        creator: {
          id: sql<string>`creator.id`,
          email: sql<string>`creator.email`,
          firstName: sql<string>`creator.first_name`,
          lastName: sql<string>`creator.last_name`,
          profileImageUrl: sql<string>`creator.profile_image_url`,
          createdAt: sql<Date>`creator.created_at`,
          updatedAt: sql<Date>`creator.updated_at`,
        },
        completedByUser: {
          id: sql<string>`completed_by_user.id`,
          email: sql<string>`completed_by_user.email`,
          firstName: sql<string>`completed_by_user.first_name`,
          lastName: sql<string>`completed_by_user.last_name`,
          profileImageUrl: sql<string>`completed_by_user.profile_image_url`,
          createdAt: sql<Date>`completed_by_user.created_at`,
          updatedAt: sql<Date>`completed_by_user.updated_at`,
        },
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
}

export const storage = new DatabaseStorage();
