# Overview

This is a virtual meeting application built with React and Express that simulates meeting experiences with AI-generated virtual participants. The application creates realistic meeting scenarios with Arabic-speaking virtual participants who automatically engage in conversations, making it ideal for training, demonstrations, or testing meeting workflows.

The system allows users to create meetings, manage virtual participants with different personalities, and observe realistic chat interactions. All participant interactions are automated using predefined message patterns and timing controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and Arabic font support (Tajawal)
- **State Management**: TanStack Query for server state and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat updates

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for CRUD operations on meetings, participants, and messages
- **Real-time**: WebSocket server for broadcasting chat messages
- **Data Storage**: In-memory storage implementation with interface for future database integration
- **Development**: Hot reloading with Vite middleware integration

### Data Storage Solutions
- **Current Implementation**: In-memory storage using Map collections for rapid prototyping
- **Database Ready**: Drizzle ORM configured for PostgreSQL with Neon serverless
- **Schema Design**: Type-safe database schema with Zod validation
- **Migration Support**: Drizzle-kit for database migrations and schema management

### Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session handling infrastructure present
- **Security**: CORS and basic request validation in place

### External Dependencies
- **Database**: Neon serverless PostgreSQL (configured but not actively used)
- **UI Components**: Radix UI for accessible component primitives
- **Validation**: Zod for runtime type checking and schema validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Development**: Replit-specific development tools and error handling

The architecture follows a clean separation between client and server with shared type definitions, making it easy to maintain consistency across the full stack. The virtual participant system uses predefined Arabic message patterns with configurable timing to create realistic meeting interactions.