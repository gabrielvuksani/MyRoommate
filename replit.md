# RoomieHub - Roommate Management App

## Overview

RoomieHub is a full-stack web application designed to help roommates manage shared living responsibilities. The app provides features for chore management, expense splitting, calendar events, and real-time messaging. Built with a modern React frontend and Express.js backend, it uses PostgreSQL for data persistence and WebSocket for real-time communication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom iOS-inspired design system
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with real-time WebSocket support
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and type-safe queries
- **Connection**: Neon serverless PostgreSQL adapter
- **Session Storage**: Connect-pg-simple for session persistence

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: Automatic user creation and profile synchronization
- **Security**: HTTP-only cookies with secure flags in production

### Household Management
- **Multi-tenant Design**: Users can belong to households via invite codes
- **Role-based Access**: Admin and member roles with different permissions
- **Invite System**: 8-character alphanumeric codes for joining households

### Chore Management
- **Kanban Board**: Todo, Doing, Done status tracking
- **Assignment System**: Assign chores to specific household members
- **Recurring Tasks**: Support for daily, weekly, monthly recurrence
- **Streak Tracking**: Gamification with completion streaks
- **Due Date Management**: Overdue detection and notifications

### Expense Splitting
- **Multiple Split Types**: Equal, custom, and percentage-based splitting
- **Category System**: Predefined categories (groceries, utilities, rent, etc.)
- **Balance Tracking**: Real-time calculation of who owes what
- **Settlement Management**: Mark individual splits as settled

### Real-time Features
- **WebSocket Integration**: Live messaging and notifications
- **Auto-sync**: Real-time updates across all connected clients
- **Message Types**: Support for user messages and system notifications

## Data Flow

1. **Authentication Flow**: User authenticates via Replit Auth → Session created → User profile synced
2. **Household Join**: User enters invite code → Validates household → Creates membership record
3. **Chore Creation**: Admin creates chore → Assigns to member → Real-time notification sent
4. **Expense Split**: User creates expense → System calculates splits → Updates all member balances
5. **Real-time Updates**: Any data change → WebSocket broadcast → UI updates across all clients

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection and query execution
- **drizzle-orm**: Type-safe database queries and schema management
- **@tanstack/react-query**: Server state management and caching
- **express-session**: Session management middleware
- **passport**: Authentication middleware with OpenID Connect strategy

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Consistent icon library
- **wouter**: Lightweight routing solution

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production server code
- **vite**: Frontend build tool with HMR support

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static files in `dist/public`
2. **Server Build**: ESBuild bundles TypeScript server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations ensure schema is up-to-date

### Environment Configuration
- **Development**: Local PostgreSQL with Vite dev server
- **Production**: Neon serverless PostgreSQL with built static assets
- **Required Variables**: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`

### Scaling Considerations
- **Database**: Serverless PostgreSQL scales automatically
- **Sessions**: Stored in database for multi-instance support
- **WebSockets**: Single-instance limitation, requires sticky sessions for horizontal scaling

### Mobile-First Design
- **Responsive**: Optimized for mobile with max-width container
- **iOS Styling**: Native iOS design patterns and color scheme
- **Touch Interactions**: Optimized for touch-based navigation

## Changelog

Changelog:
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.