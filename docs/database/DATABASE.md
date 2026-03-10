# Database Schema

Card Clash uses Supabase (PostgreSQL) for data storage. This document describes the schema and policies.

---

## Overview

| Table           | Purpose                                   |
|-----------------|-------------------------------------------|
| `question_card` | Stores quiz questions with answer options |

---

## question_card

Stores individual quiz questions for the teacher tools.

### Columns

| Column                | Type        | Constraints | Default           |
|-----------------------|-------------|-------------|-------------------|
| id                    | uuid        | PRIMARY KEY | gen_random_uuid() |
| category              | text        |             | —                 |
| question              | text        | NOT NULL    | —                 |
| difficulty            | text        | NOT NULL    | —                 |
| timer_seconds         | integer     |             | 60                |
| answer_option_1       | text        | NOT NULL    | —                 |
| answer_option_2       | text        |             | —                 |
| answer_option_3       | text        |             | —                 |
| answer_option_4       | text        |             | —                 |
| correct_answer_option | varchar(1)  | NOT NULL    | -                 |
| created_at            | timestamptz |             | now()             |

### Difficulty Values

Stored in lowercase: `intro`, `core`, `challenge`

### RLS (question_card)

- **RLS**: Disabled (for development)
- **Policies**: None

> For production, enable RLS and add policies. Example:
>
> alter table question_card enable row level security;
> create policy "Allow insert for authenticated"
>   on question_card for insert to authenticated with check (true);
> 