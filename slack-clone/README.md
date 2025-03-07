# Slack Clone

A Slack clone project built with Remix and Supabase.

## Features

- User authentication (login/signup)
- Channel creation and listing
- Real-time chat by channel
- Message sending and display

## Tech Stack

- Frontend: Remix, React, Tailwind CSS
- Backend: Supabase (authentication, database, real-time functionality)

## Installation and Setup

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
Create a `.env` file and configure your Supabase project URL and API key:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Run the development server
```bash
npm run dev
```

## Database Setup

You need to create the following tables in Supabase:

### channels table
- id (UUID, primary key)
- name (string)
- created_at (timestamp, default now())
- created_by (UUID, foreign key -> auth.users.id)

### messages table
- id (UUID, primary key)
- channel_id (UUID, foreign key -> channels.id)
- user_id (UUID, foreign key -> auth.users.id)
- content (text)
- created_at (timestamp, default now())

## Supabase Real-time Setup

In the Supabase dashboard, go to Database > Replication settings and enable real-time delivery for INSERT and UPDATE events on the messages table. 