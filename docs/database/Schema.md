## Database Schema

### question_card
| Column            | Type        | Constraints                   |
|-------------------|-------------|-------------------------------|
| id                | uuid        | PK, default gen_random_uuid() |
| category          | text        | NOT NULL                      |
| question          | text        | NOT NULL                      |
| difficulty        | text        |                               |
| timer_seconds     | int         | default 60                    |
| answer_option_1–4 | text        |                               |
| created_at        | timestamptz | default now()                 |

### RLS
- RLS: disabled
  - Policies: none