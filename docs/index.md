# Project Documentation Index

## Project Overview

- **Project Name**: Cortexa
- **Type**: Web Application (Monolith)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript

## Quick Reference

- **Tech Stack**: Next.js 16, Prisma 7, Tailwind 4, React 19.
- **Root Directory**: `/`
- **Source Directory**: `src/`
- **Database**: SQLite/LibSQL

## Core Documentation (Generated)

These documents provide a high-level overview of the system state.

- [**Project Overview**](./project-overview.md) - Executive summary and features.
- [**System Architecture**](./architecture.md) - Technical architecture and patterns.
- [**Data Models**](./data-models.md) - Database schema and relationships.
- [Source Tree Analysis](./source-tree-analysis.md) _(To be generated)_
- [API Contracts](./api-contracts.md) _(To be generated)_

## Feature Deep Dives (Existing)

Detailed documentation for specific subsystems found in the project root.

### Core Features
- [**Inline References**](../INLINE_REFERENCES_README.md) - Complete guide to the referencing system.
- [**EditorJS Integration**](../EDITORJS_README.md) - Rich text editor implementation.
- [**Authentication**](../AUTH_README.md) - Auth flows and setup.

### Technical Implementation
- [**React Query**](../REACT_QUERY_IMPLEMENTATION.md) - Data fetching strategy.
- [**Prisma Setup**](../PRISMA_SETUP.md) - Database configuration.
- [**Theme Setup**](../THEME_SETUP.md) - UI theming guide.

## Getting Started

1. **Install Dependencies**: `bun install` or `npm install`
2. **Setup Database**: `npm run db:migrate` (or `bun run db:migrate`)
3. **Start Development**: `npm run dev` (or `bun run dev`)
