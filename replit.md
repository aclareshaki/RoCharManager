# Replit.md - RO Account Manager

## Overview

This is a Ragnarok Online-themed account and character management application. It provides a dashboard interface for managing game accounts and their associated characters, featuring a dark blue aesthetic inspired by classic RO login screens. The application allows users to create, update, and delete accounts and characters with a visually themed UI using glassmorphism panels and character class sprites.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with custom RO-themed dark color palette and CSS variables
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Animations**: Framer Motion for panel transitions and dialog animations
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in shared routes with Zod schemas for validation
- **Build Tool**: Vite for development with HMR, esbuild for production server bundling

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - defines accounts and characters tables with relations
- **Migrations**: Drizzle Kit for schema migrations (`npm run db:push`)

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components including RO-themed custom components
│       ├── hooks/        # React Query hooks for data fetching
│       ├── pages/        # Route page components
│       └── lib/          # Utilities and query client setup
├── server/           # Express backend
│   ├── routes.ts     # API endpoint definitions
│   ├── storage.ts    # Database access layer (IStorage interface)
│   └── db.ts         # Drizzle database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle schema and Zod types
│   └── routes.ts     # API route definitions with validation schemas
└── migrations/       # Database migration files
```

### Key Design Patterns
- **Shared Type Safety**: Zod schemas in `shared/routes.ts` provide runtime validation and TypeScript types for both client and server
- **Storage Abstraction**: `IStorage` interface in `server/storage.ts` abstracts database operations for testability
- **Component Composition**: Custom RO-themed components (ROPanel, ROButton, ROInput) wrap base functionality with consistent styling

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI/Component Libraries
- **Radix UI**: Full suite of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-styled component collection built on Radix
- **Lucide React**: Icon library
- **Framer Motion**: Animation library for smooth transitions

### Build & Development
- **Vite**: Frontend build tool with React plugin and HMR
- **esbuild**: Server-side bundling for production
- **Drizzle Kit**: Database schema management and migrations

### External APIs
- **Divine Pride Sprites**: Character sprites loaded from `https://static.divine-pride.net/images/jobs/png/male/${jobId}.png`