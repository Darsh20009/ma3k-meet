# Overview

This is a virtual meeting application called "معك ميتيجس" (Ma'ak Meetings) built with React and Express that surpasses Zoom's functionality with innovative features. The application creates realistic meeting scenarios with Arabic-speaking virtual participants who automatically engage in conversations, while also supporting real user-to-user communication through WebRTC technology.

The system allows users to create meetings with 6-digit codes, manage virtual participants with different personalities, observe realistic chat interactions, share meeting links with others, use fullscreen mode, and communicate with real users through voice and video. All participant interactions are automated using predefined message patterns and timing controls.

## Recent Changes (January 2025)

✓ Added meeting link sharing functionality with copy-to-clipboard feature
✓ Implemented fullscreen mode with zoom and expand capabilities  
✓ Created join meeting page for external participants to enter meetings via shared links
✓ Enhanced participant management with dynamic rendering of virtual attendees
✓ Added user name persistence across sessions using localStorage
✓ Improved Arabic RTL layout and responsive design
✓ Added visual enhancements including hover effects and better color schemes

## Latest Updates (August 2025)

✓ Fixed mobile responsiveness with collapsible UI elements and proper mobile controls
✓ Removed intrusive tooltips that appeared/disappeared unexpectedly
✓ Enhanced camera and screen sharing functionality with proper permission handling
✓ Added creative participant icons with personality-based colors and FontAwesome icons
✓ Implemented mobile participant management overlay for full mobile functionality
✓ Enhanced participant templates with emojis (🎨 Designer, 👔 Manager, 🎓 Student)
✓ Improved sharing mechanism with better error handling and debug logging
✓ Fixed participant management display issues across mobile and desktop

## Current Enhancement (August 2025)

✓ Added comprehensive meeting data display with 6-digit meeting codes
✓ Implemented join-by-code functionality with dedicated page (/join)
✓ Enhanced participant management with detailed meeting information
✓ Added quick emoji reactions with floating animations
✓ Fixed duplicate "join by code" buttons in UI
✓ Added WebRTC infrastructure for real user-to-user voice/video communication
✓ Enhanced media controls with proper stream management
✓ Improved WebSocket signaling for WebRTC peer connections

## Migration and Enhancement (August 2025)

✓ Successfully migrated from Replit Agent to standard Replit environment
✓ Enhanced real user management system with proper identity handling
✓ Fixed sharing link functionality to properly distinguish between real and virtual participants
✓ Implemented real-time user tracking with online/offline status
✓ Added separate sections for real users vs virtual participants in UI
✓ Improved WebSocket handling for better real-time collaboration
✓ Enhanced message system to differentiate between real user and bot messages

## Latest Creative Updates (August 2025)

✓ Completely redesigned brand to "Meet powered by ma3k" 
✓ Created stunning welcome page with animated gradients and interactive elements
✓ Added comprehensive user authentication system with client-side data storage
✓ Implemented personal chat rooms with unique links and real WebSocket connections
✓ Enhanced UI with customizable backgrounds and profile avatars
✓ Created chat manager for organizing multiple personal chat rooms
✓ Added real-time user presence and connection status
✓ Improved responsive design with Arabic RTL support throughout
✓ Enhanced user experience with smooth transitions and visual feedback
✓ Integrated WebSocket server for real-time multi-user chat functionality

## Creative UI Enhancement Migration (August 2025)

✓ Successfully migrated from Replit Agent to standard Replit environment
✓ Enhanced meeting interface headers with creative gradient designs and backdrop blur effects
✓ Redesigned chat sidebar with sophisticated glass morphism and gradient aesthetics
✓ Implemented animated background patterns with pulsing gradients and blur effects
✓ Added creative participant avatars with gradient glows and shadow effects
✓ Enhanced message bubbles with glass morphism and improved typography
✓ Upgraded input controls with dynamic gradients and visual state feedback
✓ Applied consistent purple-to-pink gradient theme throughout the interface
✓ Improved mobile responsiveness with enhanced creative button designs
✓ Enhanced participant management panel with creative glass morphism design
✓ Updated meeting interface sections with animated background patterns and gradient styling
✓ Redesigned meeting controls with sophisticated gradient effects and improved visual feedback
✓ Made participant management panel appear only when requested for cleaner interface
✓ Applied consistent creative theme across desktop and mobile participant overlays

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

## Key Features

### Meeting Management
- Create meetings with custom names and types (work meetings, study sessions, project reviews, brainstorming)
- Share meeting links for others to join via unique URLs (/meeting/:meetingId)
- Fullscreen mode with zoom and expand capabilities for immersive experience
- Real-time participant count and meeting duration tracking

### Virtual Participants
- Pre-built Arabic personas with different personalities (professional, friendly, technical)
- Automatic message generation with configurable timing (slow, medium, fast)
- Dynamic status management (active, away, offline)
- Custom participant creation with personalized avatars

### Real-time Communication
- WebSocket-based chat system with live message broadcasting
- Support for both virtual participants and real users joining via links
- Typing indicators and message timestamps
- User name persistence across browser sessions

### User Interface
- Complete Arabic RTL support with Tajawal font
- Responsive design optimized for different screen sizes
- Dark meeting interface mimicking professional video conferencing tools
- Interactive controls for microphone, video, screen sharing, and fullscreen modes