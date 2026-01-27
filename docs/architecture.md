# System Architecture

## Overview

Ju is built on the **Next.js App Router** architecture, leveraging **React Server Components (RSC)** for performance and SEO, while using **Client Components** for rich interactive features like the editor.

## Architecture Patterns

### Frontend Architecture
- **Component-Based**: UI built with reusable React components (`src/components`).
- **Headless UI**: Uses **Radix UI** primitives for accessible, unstyled functionality, styled with **Tailwind CSS**.
- **Server Side Rendering (SSR)**: Initial page loads are server-rendered.
- **Client Side Interaction**: Complex interactions (EditorJS, Drag & Drop) run on the client.

### Backend Architecture
- **Serverless/Edge Ready**: API routes defined in `src/app/api` are designed to be deployable as serverless functions.
- **Data Access Layer**: **Prisma ORM** provides a type-safe abstraction over the SQL database.
- **Authentication**: **NextAuth.js** handles session management and JWT/Database sessions.

### Data Flow
1. **Server Components**: Fetch data directly via Prisma in async components.
2. **Client Components**: Fetch data via API routes using **Tanstack Query** (React Query) for caching, optimistic updates, and background re-fetching.
3. **Mutations**: User actions (saving cards, creating folders) trigger API calls or Server Actions, updating the DB and invalidating React Query caches to refresh the UI.

## Directory Structure Strategy

```
src/
├── app/                 # App Router (Pages, Layouts, API Routes)
│   ├── api/             # Backend API endpoints
│   ├── (auth)/          # Authentication routes (group)
│   └── dashboard/       # Protected application area
├── components/          # React Components
│   ├── ui/              # Generic UI primitives (Buttons, Inputs)
│   ├── features/        # Feature-specific components
│   └── providers/       # Context providers (Auth, Query, Theme)
├── lib/                 # Shared utilities and configurations
│   ├── prisma.ts        # Database client instance
│   └── utils.ts         # Helper functions
└── types/               # TypeScript type definitions
```

## Key Subsystems

### Inline Referencing System
A complex feature allowing users to highlight text in one card and link it to another.
- **Model**: `InlineReference` table stores the relationship and anchor text.
- **UI**: Custom EditorJS plugins or overlays to handle highlighting and link creation.
- **Logic**: Resolves bidirectional links to show "Backlinks" on target cards.

### Editor Integration
- **Core**: EditorJS used for block-based content creation.
- **Storage**: Content stored as JSON blocks in the database (or mapped to `KnowledgeSection`s if distinct).
- **Extensibility**: Custom tools/plugins for specific knowledge features.
