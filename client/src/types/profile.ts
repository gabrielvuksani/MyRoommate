// Type definitions for profile components
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  profileImage?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members?: HouseholdMember[];
}

export interface HouseholdMember {
  userId: string;
  role: 'admin' | 'member';
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface NotificationEnvironment {
  platform: string;
  isInstalled: boolean;
  permission: NotificationPermission;
}

export interface NotificationInfo {
  supportLevel: 'full' | 'partial' | 'none';
  requiresInstall: boolean;
  permission: NotificationPermission;
  strategy: string;
  environment?: NotificationEnvironment;
  canRequest: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  types: {
    messages: boolean;
    chores: boolean;
    expenses: boolean;
    calendar: boolean;
    household: boolean;
  };
}