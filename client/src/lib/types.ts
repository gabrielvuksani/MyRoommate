export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  rentAmount: string | null;
  rentDueDay: number | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: string | null;
  joinedAt: Date;
  user: User;
}

export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  status: string | null;
  assignedTo: string | null;
  dueDate: Date | null;
  recurrence: string | null;
  recurrenceInterval: number | null;
  streak: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedUser?: User | null;
}

export interface Expense {
  id: string;
  householdId: string;
  title: string;
  amount: string;
  paidBy: string | null;
  category: string | null;
  splitType: string | null;
  receiptUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidByUser: User;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: string;
  settled: boolean | null;
  settledAt: Date | null;
  user: User;
}

export interface CalendarEvent {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  color: string | null;
  type: string | null;
  createdBy: string | null;
  createdAt: Date;
  creator: User;
}

export interface Message {
  id: string;
  householdId: string;
  userId: string;
  content: string;
  type: string | null;
  linkedTo: string | null;
  linkedType: string | null;
  createdAt: Date;
  user: User;
}

export interface ShoppingItem {
  id: string;
  householdId: string;
  name: string;
  quantity: number | null;
  completed: boolean | null;
  completedBy: string | null;
  completedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  creator: User;
  completedByUser: User | null;
}
