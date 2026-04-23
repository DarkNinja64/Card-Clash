# Card-Clash Database Schema

## Overview
This database supports a gamified learning platform where teachers create question decks for courses, students enroll in courses, and participate in live game sessions with real-time scoring and response tracking.

## Core Entities

### User Management

#### `profiles`
Central user profile table with role-based access control.
- **id** (UUID, PK): References `auth.users(id)` for authentication
- **displayname** (TEXT, UNIQUE): User's display name
- **created_at** (TIMESTAMP TZ): Account creation timestamp (default: now)
- **role** (TEXT, CHECK): Either 'student' or 'teacher'

#### `teacher_profiles`
Specialized profile for teachers.
- **profile_id** (UUID, PK, FK): References `profiles(id)`

#### `student_profiles`
Specialized profile for students.
- **profile_id** (UUID, PK, FK): References `profiles(id)`

### Course Management

#### `courses`
Courses created and managed by teachers.
- **id** (UUID, PK): Unique course identifier
- **teacher_id** (UUID, FK): References `teacher_profiles(profile_id)`
- **name** (TEXT, NOT NULL): Course name

#### `course_enrollments`
Student enrollment in courses.
- **id** (UUID, PK): Unique enrollment record
- **student_id** (UUID, FK): References `student_profiles(profile_id)`
- **course_id** (UUID, FK): References `courses(id)`
- **created_at** (TIMESTAMP TZ): Enrollment timestamp (default: now)

### Question & Answer Management

#### `questions`
Question bank created by teachers.
- **id** (UUID, PK): Unique question identifier
- **created_by** (UUID, FK): References `teacher_profiles(profile_id)`
- **question_text** (TEXT, NOT NULL): The question content

#### `answer_options`
Multiple choice answers for questions.
- **id** (UUID, PK): Unique option identifier
- **question_id** (UUID, FK): References `questions(id)`
- **answer_text** (TEXT, NOT NULL): The answer option text
- **is_correct** (BOOLEAN): Whether this is the correct answer

#### `tags`
Tags for categorizing questions.
- **id** (UUID, PK): Unique tag identifier
- **name** (VARCHAR): Tag label

**To add new tags for questions, enter the following into the supabase sql editor :** 
>insert into tags (name) values  
>('Algebra 1');

#### `question_tags`
Association table between questions and tags (many-to-many).
- **id** (UUID, PK): Unique association record
- **question_id** (UUID, FK): References `questions(id)`
- **tag_id** (UUID, FK): References `tags(id)`

#### `question_card`
Legacy question format table.
- **id** (BIGINT, PK, AUTO-INCREMENT): Unique identifier
- **created_at** (TIMESTAMP TZ, DEFAULT: now): Creation timestamp
- **category** (TEXT): Question category
- **question** (TEXT, NOT NULL): Question text
- **answer_option_1-4** (VARCHAR): Multiple choice options
- **difficulty** (USER-DEFINED): Custom difficulty type
- **timer_seconds** (SMALLINT): Time limit for answering
- **correct_answer_option** (VARCHAR): The correct answer reference

### Deck Management

#### `decks`
Question decks created from the question bank.
- **id** (UUID, PK): Unique deck identifier
- **course_id** (UUID, FK): References `courses(id)`
- **created_by** (UUID, FK): References `teacher_profiles(profile_id)`

#### `deck_question_cards`
Association table between decks and questions (many-to-many).
- **id** (UUID, PK): Unique association record
- **deck_id** (UUID, FK): References `decks(id)`
- **question_id** (UUID, FK): References `questions(id)`

### Game Session Management

#### `game_sessions`
Live game sessions based on decks.
- **id** (UUID, PK): Unique session identifier
- **deck_id** (UUID, FK): References `decks(id)`
- **started_at** (TIMESTAMP TZ): Session start time
- **ended_at** (TIMESTAMP TZ): Session end time (null if ongoing)

#### `game_participants`
Students participating in a game session.
- **id** (UUID, PK): Unique participant record
- **game_session_id** (UUID, FK): References `game_sessions(id)`
- **enrollee_id** (UUID, FK): References `course_enrollments(id)`
- **score** (INTEGER, DEFAULT: 0): Current score in the session

#### `participant_responses`
Individual responses to questions during gameplay.
- **id** (UUID, PK): Unique response record
- **game_session_id** (UUID, FK): References `game_sessions(id)`
- **game_participant_id** (UUID, FK): References `game_participants(id)`
- **deck_question_card_id** (UUID, FK): References `deck_question_cards(id)`
- **selected_answer_id** (UUID, FK): References `answer_options(id)` (null if unanswered)
- **is_correct** (BOOLEAN): Whether the response was correct
- **response_time_ms** (INTEGER): Time taken to answer in milliseconds
- **answered_at** (TIMESTAMP TZ): When the response was submitted

## Entity Relationships

## Key Workflows

### Creating a Game Session
1. Teacher creates a `deck` in a `course`
2. Teacher selects questions and adds to deck via `deck_question_cards`
3. Teacher creates a `game_session` using the deck
4. Students in `course_enrollments` join as `game_participants`
5. Each answer recorded in `participant_responses`
6. Scores calculated and stored in `game_participants`

### Question Management
1. Teachers create `questions` with `answer_options`
2. Questions optionally tagged via `question_tags` and `tags`
3. Questions grouped into `decks` via `deck_question_cards`
4. Questions used in `game_sessions`

## Notes

- **Legacy Table**: `question_card` is a legacy table structure kept for backwards compatibility. Moving forward, the primary question system should use `questions` + `answer_options`.
- **Role Separation**: `teacher_profiles` and `student_profiles` inherit from `profiles`, allowing for role-specific extensions.
- **Response Tracking**: `participant_responses` captures detailed metrics (response time, correctness, selected answer) for analytics.
