# Project Overview

## Executive Summary

**Ju** is a web-based knowledge management application designed for organizing information into folders and knowledge cards. It features a rich text editor (EditorJS), hierarchical folder structures, and a bidirectional inline referencing system that allows users to link knowledge cards and sections seamlessly.

The application is built as a modern **monolithic web application** using the **Next.js** framework, integrating frontend UI and backend API routes in a single codebase.

## Technology Stack

| Category | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | 16.1.4 | React 19, App Router |
| **Language** | TypeScript | 5.x | Strict typing enabled |
| **Database** | LibSQL (Turso) | - | Via Prisma ORM |
| **ORM** | Prisma | 7.3.0 | Schema-first data modeling |
| **Styling** | Tailwind CSS | 4.0 | Utility-first CSS |
| **Components** | Radix UI | - | Headless UI primitives |
| **Editor** | EditorJS | 2.31 | Block-based rich text editor |
| **State** | Tanstack Query | 5.90 | Server state management |
| **Auth** | NextAuth.js | 4.24 | Authentication (Bcrypt adapter) |

## Architecture Type

**Monolith (Modular)**

The project follows a modular monolithic architecture within the Next.js App Router structure. Features are organized by domain (auth, editor, knowledge, folders) across the application layers.

## Repository Structure

- **Structure**: Single Cohesive Project (Monolith)
- **Root**: `/`
- **Source**: `/src`

## Key Features

- **Knowledge Management**: Create, update, and organize Knowledge Cards.
- **Hierarchical Folders**: Nested folder structure for organization.
- **Rich Text Editing**: Block-based editing with headers, lists, quotes, and code.
- **Inline References**: Bidirectional linking between cards and specific text sections (Source <-> Target).
- **Authentication**: Secure user accounts.
- **Dark/Light Mode**: User interface theming.

## Documentation Links

- [Architecture](./architecture.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md) _(To be generated)_
- [Source Tree](./source-tree-analysis.md) _(To be generated)_
