# TaskFlow
A Modern, Responsive Personal Task Management System made using Next.js 15 and PostgreSQL and Typescript.

## Tech Stack

- **Frontend**
  - Next.js 15
  - React 19
  - Tailwind CSS
  - Radix UI Primitive Components
  - Zustand (State Management)
  - React Query (Data Fetching)

- **Backend**
  - PostgreSQL (via Neon DB)
  - Drizzle ORM
  - Next.js API Routes

## Features

- **Authentication**
  - Secure user registration and login
  - Token-based authentication /w Zustand
  - Protected routes

- **Task Management**
  - Create, update, and delete tasks
  - Set task priorities and deadlines
  - Group tasks by projects

- **Project Organization**
  - Create and manage multiple projects
  - Project statistics and progress tracking

- **User Interface**
  - Modern, responsive design with Tailwind CSS
  - Dark/Light theme support
  - Interactive dashboard
  - Mobile-friendly layout

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [the created folder]
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

- Rename .env.example to .env.local
- Fill in required environment variables

4. Set up the database:

```bash
npm run db:generate
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

### Available Scripts
- **npm run dev** - Start development server with Turbopack
- **npm run build** - Build production application
- **npm run start** - Start production server
- **npm run lint** - Run ESLint
- **npm run db:push** - Push database schema changes
- **npm run db:studio** - Open Drizzle Studio
- **npm run db:generate** - Generate database migrations
- **npm run db:migrate** - Run database migrations


