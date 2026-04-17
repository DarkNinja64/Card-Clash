# Database Schema Documentation

Card-Clash uses Supabase (PostgreSQL) for data storage. This document describes the complete database schema, relationships, and common operations.

---

## Overview

The Card-Clash database is built around a gamified learning platform where:
- **Teachers** create questions and organize them into decks
- **Students** enroll in courses and participate in live game sessions
- **Game Sessions** track real-time responses and scoring with detailed analytics

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts with role-based access (student/teacher) |
| `courses` | Courses created and managed by teachers |
| `course_enrollments` | Student enrollment records |
| `questions` | Question bank with metadata |
| `answer_options` | Multiple choice answers for questions |
| `tags` | Category tags for organizing questions |
| `question_tags` | Association table (questions ↔ tags) |
| `decks` | Question sets organized for courses |
| `deck_question_cards` | Association table (decks ↔ questions) |
| `game_sessions` | Live game instances using decks |
| `game_participants` | Student participation records in game sessions |
| `participant_responses` | Individual answer responses with timing and correctness |

---

## Core Entities

### User Management

#### `profiles`
Central user profile table with role-based access control.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY, FK → auth.users(id) | — |
| `displayname` | TEXT | UNIQUE | — |
| `created_at` | TIMESTAMPTZ | — | now() |
| `role` | TEXT | CHECK (role IN ('student', 'teacher')) | — |

**Purpose**: Stores authentication-linked user profiles with role separation.

#### `teacher_profiles`
Specialized profile table for teachers (role-specific extension).

| Column | Type | Constraints |
|--------|------|-------------|
| `profile_id` | UUID | PRIMARY KEY, FK → profiles(id) |

**Purpose**: Enables role-specific data extensions for teachers.

#### `student_profiles`
Specialized profile table for students (role-specific extension).

| Column | Type | Constraints |
|--------|------|-------------|
| `profile_id` | UUID | PRIMARY KEY, FK → profiles(id) |

**Purpose**: Enables role-specific data extensions for students.

---

### Course Management

#### `courses`
Courses created and managed by teachers.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `teacher_id` | UUID | NOT NULL, FK → teacher_profiles(profile_id) |

**Purpose**: Represents a course offered by a teacher.

**Example Usage**: Teacher creates a "Algebra 101" course.

#### `course_enrollments`
Student enrollment records linking students to courses.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `student_id` | UUID | NOT NULL, FK → student_profiles(profile_id) |

**Purpose**: Tracks which students are enrolled in which courses.

**Example Usage**: Student enrolls in "Algebra 101" course.

---

### Content Management

#### `questions`
Question bank created by teachers.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `created_by` | UUID | FK → teacher_profiles(profile_id) |
| `question_text` | TEXT | NOT NULL |

**Purpose**: Stores quiz questions with creator attribution.

#### `answer_options`
Multiple choice answers for questions.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `question_id` | UUID | NOT NULL, FK → questions(id) |
| `answer_text` | TEXT | NOT NULL |
| `is_correct` | BOOLEAN | — |

**Purpose**: Stores multiple choice options with correctness flag.

**Example**:
- Question: "What is 2 + 2?"
- Option 1: "3" (is_correct: false)
- Option 2: "4" (is_correct: true)
- Option 3: "5" (is_correct: false)

#### `tags`
Category tags for organizing and filtering questions.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `name` | VARCHAR | — |

**Purpose**: Provides flexible categorization (e.g., 'easy', 'algebra', 'review').

#### `question_tags`
Association table linking questions to tags (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `question_id` | UUID | NOT NULL, FK → questions(id) |
| `tag_id` | UUID | NOT NULL, FK → tags(id) |

**Purpose**: Enables flexible tagging of questions.

**Example**: Question "What is 2+2?" tagged with both 'easy' and 'arithmetic'.

---

### Deck Management

#### `decks`
Question sets organized for courses.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `course_id` | UUID | NOT NULL, FK → courses(id) |
| `created_by` | UUID | NOT NULL, FK → teacher_profiles(profile_id) |

**Purpose**: Groups questions into organized sets for a specific course.

**Example Usage**: Teacher creates "Chapter 3 Quiz" deck in "Algebra 101" course.

#### `deck_question_cards`
Association table linking decks to questions (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `deck_id` | UUID | NOT NULL, FK → decks(id) |
| `question_id` | UUID | NOT NULL, FK → questions(id) |

**Purpose**: Specifies which questions belong to which deck.

---

### Game Sessions

#### `game_sessions`
Live game instances using a specific deck.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `deck_id` | UUID | NOT NULL, FK → decks(id) |
| `started_at` | TIMESTAMPTZ | — |
| `ended_at` | TIMESTAMPTZ | — |

**Purpose**: Represents a live game session. `ended_at` is NULL for ongoing games.

**Example Usage**: Teacher starts "Chapter 3 Quiz" for all enrolled students.

#### `game_participants`
Student participation records in game sessions with score tracking.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | — |
| `game_session_id` | UUID | NOT NULL, FK → game_sessions(id) | — |
| `enrollee_id` | UUID | NOT NULL, FK → course_enrollments(id) | — |
| `score` | INTEGER | — | 0 |

**Purpose**: Tracks each student's participation and accumulated score in a session.

#### `participant_responses`
Individual answer responses with detailed metrics.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `game_session_id` | UUID | NOT NULL, FK → game_sessions(id) |
| `game_participant_id` | UUID | NOT NULL, FK → game_participants(id) |
| `deck_question_card_id` | UUID | NOT NULL, FK → deck_question_cards(id) |
| `selected_answer_id` | UUID | FK → answer_options(id) |
| `is_correct` | BOOLEAN | — |
| `response_time_ms` | INTEGER | — |
| `answered_at` | TIMESTAMPTZ | — |

**Purpose**: Records every answer submitted with timing and correctness data for analytics.

**Metrics Tracked**:
- Which answer was selected
- Whether it was correct
- Response time in milliseconds
- Timestamp of submission

---

## Entity Relationship Diagram
```
┌─────────────────────────────────────────────────────┐
│                auth.users (External)                │
│           (Authentication Provider)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ├──→ profiles  ◄──┐
                     │                 │
                     ├──────┬──────────┘
                     │      │
                teacher    student
                profiles   profiles
                     │      │
                     │      └──→ course_enrollments
                     │           │
    ┌────────────────┘           │
    │                            │
    ├──→ courses ◄───────────────┘
    │       │
    │       └──→ decks
    │           │
    ├──→ questions
    │       │
    │       ├──→ answer_options
    │       │
    │       └──→ question_tags
    │           │
    │           └──→ tags
    │
    └──→ deck_question_cards
    │
    └──→ game_sessions
    │
    └──→ game_participants
    │
    └──→ participant_responses
```

---

## Common Workflows

### 1. Teacher Setup
1. Teacher account created in `profiles` with role='teacher'
2. Teacher profile created in `teacher_profiles`
3. Teacher creates a `course`

### 2. Student Enrollment
1. Student account created in `profiles` with role='student'
2. Student profile created in `student_profiles`
3. Student record added to `course_enrollments` for a course

### 3. Content Creation
1. Teacher creates `questions` with `answer_options`
2. Teacher optionally tags questions via `question_tags`
3. Teacher creates a `deck` and adds questions via `deck_question_cards`

### 4. Game Session Execution
1. Teacher starts a `game_session` using a deck
2. Enrolled students added as `game_participants` with initial score=0
3. Students answer questions, responses recorded in `participant_responses`
4. Scores updated in `game_participants` based on correctness
5. Teacher ends the session, `ended_at` timestamp recorded

### 5. Analytics & Scoring
- Final scores retrieved from `game_participants.score`
- Response accuracy calculated from `participant_responses`
- Average response time from `participant_responses.response_time_ms`
- Leaderboards generated by ranking `game_participants` by score

---

## Legacy Tables

### `question_card`
Original question format table (deprecated for new development).

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | BIGINT | PRIMARY KEY, AUTO-INCREMENT | — |
| `created_at` | TIMESTAMPTZ | — | now() |
| `category` | TEXT | — | — |
| `question` | TEXT | NOT NULL | — |
| `answer_option_1` | VARCHAR | NOT NULL | — |
| `answer_option_2` | VARCHAR | — | — |
| `answer_option_3` | VARCHAR | — | — |
| `answer_option_4` | VARCHAR | — | — |
| `difficulty` | USER-DEFINED | NOT NULL | — |
| `timer_seconds` | SMALLINT | — | — |
| `correct_answer_option` | VARCHAR | — | — |
  
  
  

**Status**: Legacy table. Use `questions` + `answer_options` for new features.

---
