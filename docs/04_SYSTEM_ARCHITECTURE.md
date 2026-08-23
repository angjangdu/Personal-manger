# Personal OS — System Architecture Document

**Version:** 2.0  
**Date:** August 2026

## 1. Architecture Strategy

The system uses a modular layered architecture:

```text
Presentation
 ↓
Application Services
 ↓
Business Logic
 ↓
Data Access
 ↓
Database
```

The initial demo can operate locally without authentication or a backend.

## 2. Recommended Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js server-side services
- Supabase

### Database
- PostgreSQL

### Authentication
- Supabase Auth, introduced later

### Deployment
- GitHub
- Vercel
- Supabase

### Mobile
- Responsive Web
- PWA
- Android packaging

## 3. High-Level Architecture

```text
                    PERSONAL OS
                         |
          +--------------+--------------+
          |                             |
       Frontend                     Future Admin
          |                             |
          +--------------+--------------+
                         |
                 Application Services
                         |
        +----------------+----------------+
        |                |                |
     Tasks/Goals      Activities       Analytics
        |                |                |
        +----------------+----------------+
                         |
                       Data
                         |
                    Supabase
                         |
                    PostgreSQL
```

## 4. Frontend Structure

```text
src/
├── app/
├── components/
├── services/
├── lib/
├── hooks/
├── types/
├── utils/
└── tests/
```

## 5. Core Modules

```text
auth
users
tasks
projects
goals
activities
calendar
habits
study
notes
analytics
notifications
ai
```

Authentication is not part of the initial UI demo but is reserved as a later module.

## 6. Data Model

```text
PROFILE
 ├── TASKS
 ├── PROJECTS
 ├── GOALS
 ├── ACTIVITIES
 ├── HABITS
 ├── CALENDAR EVENTS
 ├── STUDY
 ├── NOTES
 └── DAILY REVIEWS
```

## 7. Core Relationships

```text
Goal
 ↓
Project
 ↓
Task
 ↓
Activity
 ↓
Time
 ↓
Analytics
```

## 8. Database Tables

```text
profiles
tasks
subtasks
projects
goals
milestones
activities
habits
habit_logs
calendar_events
study_subjects
study_topics
study_sessions
notes
tags
notifications
daily_reviews
audit_logs
```

## 9. Activity Architecture

Do not rely entirely on a browser timer.

```text
Start
 ↓
Store start_time
 ↓
Display elapsed time
 ↓
Stop
 ↓
Store end_time
 ↓
Server calculates duration
```

## 10. Analytics Architecture

```text
Tasks
Activities
Goals
Projects
Habits
 ↓
Analytics Service
 ↓
Aggregated Metrics
 ↓
Dashboard
```

## 11. Security Architecture

When the backend is introduced:

```text
HTTPS
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
RLS
 ↓
Database
```

User-owned rows should contain `user_id` and be protected with PostgreSQL RLS.

## 12. Authentication Architecture — Later Phase

There is no public registration.

Later production flow:

```text
Admin
 ↓
Protected Server Operation
 ↓
Create Auth User
 ↓
Create Profile
 ↓
User Login
```

The Supabase service-role key must remain server-side.

## 13. AI Architecture — Future

```text
User
 ↓
AI Interface
 ↓
AI Service
 ↓
AI Provider
 ↓
Structured Response
 ↓
Validation
 ↓
User Confirmation
 ↓
Application Action
```

AI should not bypass normal authorization or business logic.

## 14. Deployment

```text
Developer
 ↓
GitHub
 ↓
Vercel
 ↓
Next.js
 ↓
Supabase
 ├── Auth
 ├── PostgreSQL
 └── Storage
```

## 15. Mobile Architecture

```text
Next.js
 ↓
Responsive Web
 ↓
PWA
 ↓
Android
```

Separate Android development should not be the first approach.

## 16. Scalability

The application should remain modular and stateless at the application layer. Database-backed state should be persisted in PostgreSQL.

## 17. Testing Layers

```text
Unit
 ↓
Integration
 ↓
API
 ↓
Security
 ↓
UI
 ↓
E2E
```

## 18. Architectural Objective

The architecture should support:

- Secure data
- Modular development
- Maintainability
- Responsive web
- Android readiness
- Analytics
- Future AI
- Future automation
