# Supabase Setup Guide

This guide covers configuring Supabase for the Card Clash project.

---

## Prerequisites

- A [Supabase](https://supabase.com) account (If you want to make changes to table schemas)

---

## 1. Get Your Credentials

1. Open your Supabase project in the [dashboard](https://supabase.com/dashboard)
2. Go to **Project Settings** (gear icon) → **API**
3. Copy the following values:

| Variable             | Where to Find                      | Notes                                                                                           |
|----------------------|------------------------------------|-------------------------------------------------------------------------------------------------|
| **Project URL**      | "Project URL" section              | Use the API URL only (e.g. `https://xxxxx.supabase.co`). Do **not** use the dashboard page URL. |
| **Anon key**         | "Project API keys" → anon (public) | Safe for client-side use                                                                        |
| **Service role key** | "Project API keys" → service_role  | Server-side only. Never expose in client code. Bypasses RLS.                                    |

---

## 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   cp .env.example .env.local
2. Edit .env.local and replace placeholders with your actual values:     
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. Important: .env.local must be in the project root (same folder as package.json). Next.js does not load env files from subdirectories.

## 3. Common Mistakes

**Wrong Project URL**
- Wrong: https://supabase.com/dashboard/project/xxxxx.supabase.co (dashboard URL)
- Correct: https://xxxxx.supabase.co (API URL only)

**Malformed Service Role Key**
- The service role key is a JWT with 3 parts separated by dots
- Ensure the full key is copied with no line breaks, spaces, or truncation
- Re-copy from Supabase if you see "Expected 3 parts in JWT; got 1"

**Wrong File Location**
- .env.local must be in the project root, not in src/ or src/lib/supabase/

   