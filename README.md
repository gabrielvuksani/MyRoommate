# myRoommate - Roommate Management App

## Overview

myRoommate is a full-stack web application designed to help roommates manage shared living responsibilities. The app provides features for listing and renting roommate openings, managing inhouse chores, expense splitting, calendar events, and real-time messaging. Built with a modern React frontend and Express.js backend, it uses PostgreSQL for data persistence and WebSocket for real-time communication. Supabase is used for DB backend integration.

**Preview Beta Link: https://myroommate.app**

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
- **Authentication**: Supabase Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM (Supabase)
- **Schema Management**: Drizzle Kit for migrations and type-safe queries
- **Connection**: Supabase PostgreSQL with transaction pooler
- **Session Storage**: Connect-pg-simple for session persistence
