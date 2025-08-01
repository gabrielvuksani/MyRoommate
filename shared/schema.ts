import {
  pgTable,
  text,
  varchar,
  timestamp,
  date,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Custom Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  profileColor: varchar("profile_color").default('blue'),
  verified: boolean("verified").default(false),
  verificationToken: varchar("verification_token"),
  phoneNumber: varchar("phone_number"),
  dateOfBirth: date("date_of_birth"),
  idVerified: boolean("id_verified").default(false),
  wasKickedFromHousehold: boolean("was_kicked_from_household").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Households table
export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  inviteCode: varchar("invite_code", { length: 8 }).unique().notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }),
  rentDueDay: integer("rent_due_day"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Household members
export const householdMembers = pgTable("household_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Chores table
export const chores = pgTable("chores", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status").default("todo"), // todo, doing, done
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  recurrence: varchar("recurrence"), // daily, weekly, monthly, custom
  recurrenceInterval: integer("recurrence_interval").default(1),
  streak: integer("streak").default(0),
  completedAt: timestamp("completed_at"),
  priority: varchar("priority").default("medium"), // urgent, high, medium, low
  category: varchar("category").default("general"), // general, cleaning, cooking, maintenance, shopping, finance
  estimatedDuration: integer("estimated_duration"), // in minutes
  notes: text("notes"),
  subtasks: text("subtasks").array(), // array of subtask strings
  reminder: varchar("reminder"), // none, ontime, 15min, 30min, 1hour, 1day
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id),
  title: varchar("title", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidBy: varchar("paid_by").references(() => users.id),
  category: varchar("category"),
  splitType: varchar("split_type").default("equal"), // equal, custom, percentage
  receiptUrl: varchar("receipt_url"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceFrequency: varchar("recurrence_frequency"), // weekly, monthly, quarterly, yearly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expense splits
export const expenseSplits = pgTable("expense_splits", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseId: uuid("expense_id").references(() => expenses.id),
  userId: varchar("user_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  settled: boolean("settled").default(false),
  settledAt: timestamp("settled_at"),
});

// Calendar events
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  color: varchar("color").default("#007AFF"),
  type: varchar("type"), // rent, utility, social, chore, bill, meeting, personal, other
  location: text("location"),
  attendees: text("attendees").array(), // array of user IDs
  reminder: varchar("reminder"), // none, ontime, 15min, 30min, 1hour, 1day
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern"), // daily, weekly, monthly, yearly
  allDay: boolean("all_day").default(false),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id),
  userId: varchar("user_id").references(() => users.id),
  content: text("content").notNull(),
  type: varchar("type").default("text"), // text, system, attachment
  linkedTo: varchar("linked_to"), // bill_id, chore_id, event_id, grocery_id
  linkedType: varchar("linked_type"), // bill, chore, event, grocery
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping list items
export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").default(1),
  completed: boolean("completed").default(false),
  completedBy: varchar("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").notNull(), // {p256dh, auth}
  deviceInfo: jsonb("device_info"), // {browser, os, device}
  active: boolean("active").default(true).notNull(),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_push_subscriptions_user_id").on(table.userId),
  index("idx_push_subscriptions_endpoint").on(table.endpoint),
  index("idx_push_subscriptions_active").on(table.active)
]);

export const roommateListings = pgTable("roommate_listings", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  description: text("description"),
  rent: integer("rent").notNull(),
  utilities: integer("utilities"), // Separate utilities cost
  location: text("location").notNull(), // Street address
  city: text("city").notNull(),
  state: text("state"),
  zipCode: text("zip_code"),
  university: text("university"), // University name
  distanceToCampus: text("distance_to_campus"),
  availableFrom: timestamp("available_from", { withTimezone: true }).notNull(),
  availableTo: timestamp("available_to", { withTimezone: true }), // Lease end date
  roomType: text("room_type", { enum: ["private", "shared", "studio"] }).notNull(),
  housingType: text("housing_type", { enum: ["apartment", "house", "condo", "townhouse", "dorm", "shared_house"] }).notNull(),
  genderPreference: text("gender_preference", { enum: ["male", "female", "any", "non_binary"] }),
  studentYear: text("student_year", { enum: ["freshman", "sophomore", "junior", "senior", "graduate", "any"] }),
  studyHabits: text("study_habits", { enum: ["quiet", "moderate", "social", "flexible"] }),
  socialPreferences: text("social_preferences", { enum: ["introverted", "extroverted", "balanced", "flexible"] }),
  lifestylePreferences: text("lifestyle_preferences").array(), // ["non_smoking", "pet_friendly", "vegetarian", etc.]
  amenities: text("amenities").array(),
  images: text("images").array(),
  contactInfo: text("contact_info"),
  verified: boolean("verified").default(false).notNull(), // Student verification status
  isActive: boolean("is_active").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  householdMembers: many(householdMembers),
  chores: many(chores),
  expenses: many(expenses),
  expenseSplits: many(expenseSplits),
  calendarEvents: many(calendarEvents),
  messages: many(messages),
  shoppingItems: many(shoppingItems),
  roommateListings: many(roommateListings),
  pushSubscriptions: many(pushSubscriptions),
}));

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(householdMembers),
  chores: many(chores),
  expenses: many(expenses),
  calendarEvents: many(calendarEvents),
  messages: many(messages),
  shoppingItems: many(shoppingItems),
}));

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  household: one(households, {
    fields: [householdMembers.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [householdMembers.userId],
    references: [users.id],
  }),
}));

export const choresRelations = relations(chores, ({ one }) => ({
  household: one(households, {
    fields: [chores.householdId],
    references: [households.id],
  }),
  assignedUser: one(users, {
    fields: [chores.assignedTo],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  household: one(households, {
    fields: [expenses.householdId],
    references: [households.id],
  }),
  paidByUser: one(users, {
    fields: [expenses.paidBy],
    references: [users.id],
  }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseSplits.userId],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  household: one(households, {
    fields: [calendarEvents.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [calendarEvents.createdBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  household: one(households, {
    fields: [messages.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const shoppingItemsRelations = relations(shoppingItems, ({ one }) => ({
  household: one(households, {
    fields: [shoppingItems.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [shoppingItems.createdBy],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [shoppingItems.completedBy],
    references: [users.id],
  }),
}));

export const roommateListingsRelations = relations(roommateListings, ({ one }) => ({
  creator: one(users, {
    fields: [roommateListings.createdBy],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  inviteCode: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSplitSchema = createInsertSchema(expenseSplits).omit({
  id: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingItemSchema = createInsertSchema(shoppingItems).omit({
  id: true,
  createdAt: true,
});

export const insertRoommateListingSchema = createInsertSchema(roommateListings).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  availableFrom: z.string().transform((val) => new Date(val)),
  availableTo: z.union([z.string(), z.null()]).optional().transform((val) => val ? new Date(val) : null),
  contactInfo: z.string().email("Please enter a valid email address for contact"),
});

// Authentication schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verified: true,
  verificationToken: true,
  idVerified: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  lastActive: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type InsertExpenseSplit = z.infer<typeof insertExpenseSplitSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
export type RoommateListing = typeof roommateListings.$inferSelect;
export type InsertRoommateListing = z.infer<typeof insertRoommateListingSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
