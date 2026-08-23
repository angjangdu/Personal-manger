# Personal OS — Complete Product Documentation

# 1. 01 PRD

# Personal OS — Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** August 2026

## 1. Product Overview

Personal OS is a personal productivity and activity-management platform designed to help a user plan, execute, track, review, and improve their daily work.

Core loop:

```text
Plan → Prioritize → Execute → Track → Review → Improve
```

The first product milestone focuses on the actual productivity experience. Authentication and admin account management are infrastructure added later.

## 2. Problem

Users often manage tasks, schedules, study, projects, goals, habits, notes, and time tracking across disconnected tools. Personal OS brings these activities into one connected workspace.

## 3. Product Goals

- Provide a single command center for daily activities.
- Connect goals, projects, tasks, schedules, and actual activity.
- Make daily priorities immediately visible.
- Track real time spent on work.
- Provide useful progress and productivity analytics.
- Support academic/study workflows.
- Work well on desktop and Android.
- Remain simple enough for daily use.

## 4. Target User

Primary user: an individual student/user who wants one system for academic, project, personal, and productivity activities.

## 5. Core Features

### P0
- Dashboard
- Tasks
- Projects
- Goals
- Calendar
- Daily Planner
- Activities
- Time Tracking
- Analytics
- Daily Review

### P1
- Habits
- Study Management
- Notes
- Search
- Notifications

### P2
- AI Assistant
- Smart Planning
- Automation
- Advanced insights
- Offline synchronization

## 6. Product Hierarchy

```text
Goal
 ↓
Project
 ↓
Task
 ↓
Schedule
 ↓
Activity
 ↓
Time
 ↓
Analytics
```

## 7. Authentication Requirement

There is no public signup.

However, authentication is deliberately a later implementation phase. The initial demo must work without a sign-in page and use local/mock data.

When authentication is introduced:
- Only Admin can create accounts.
- Users cannot self-register.
- Admin and User roles are supported.

## 8. Dashboard Requirements

The dashboard should show:
- Today's progress
- Today's tasks
- Today's schedule
- Current activity
- Active goals
- Active projects
- Habits
- Quick actions

## 9. Task Requirements

Users must be able to:
- Create, edit, delete, complete, and reopen tasks.
- Set priority, deadline, duration, description, tags, subtasks.
- Associate tasks with projects and goals.
- View Today, Upcoming, Inbox, Completed, and Overdue tasks.

## 10. Project Requirements

Users must be able to:
- Create and manage projects.
- Add tasks.
- Track progress.
- View deadlines and activity.

## 11. Goal Requirements

Users must be able to:
- Create goals.
- Set deadlines.
- Add milestones.
- Connect goals to projects/tasks.
- Track progress.

## 12. Calendar and Planner

Support:
- Day, week, and month views.
- Events.
- Task scheduling.
- Deadlines.
- Activity and study sessions.
- Daily time blocking.

## 13. Activity Tracking

Users can:
- Start
- Pause
- Resume
- Stop
- Review activities

Actual duration should be calculated from timestamps rather than relying only on a frontend timer.

## 14. Analytics

Analytics should include:
- Task completion
- Focus/activity time
- Project progress
- Goal progress
- Habit consistency
- Time distribution

## 15. Study

Study management should support:

```text
Course → Subject → Unit → Topic → Study Session → Revision
```

## 16. Non-Goals for Initial Demo

- Public signup
- Authentication UI
- Admin UI
- AI
- Complex integrations
- Full offline synchronization

## 17. Success Criteria

The product succeeds when a user can open the application and complete:

```text
Dashboard
 ↓
Create Goal
 ↓
Create Project
 ↓
Create Task
 ↓
Schedule Task
 ↓
Start Activity
 ↓
Track Time
 ↓
Complete Task
 ↓
Review Progress
```

without needing multiple external productivity tools.


# 2. 02 SRS

# Personal OS — Software Requirements Specification (SRS)

**Version:** 2.0  
**Date:** August 2026

## 1. Purpose

This SRS defines the functional and non-functional requirements for Personal OS.

## 2. System Scope

The system provides:
- Task management
- Project management
- Goal management
- Calendar
- Daily planning
- Activity/time tracking
- Habits
- Study management
- Notes
- Analytics
- Daily review
- Later: backend, authentication, admin, mobile, AI

## 3. User Roles

### Demo Phase
A single local/demo user context is used. No login is required.

### Production Phase
- ADMIN
- USER

Only Admin can create user accounts.

## 4. Functional Requirements

### FR-001 Dashboard
The system shall display today's progress, tasks, schedule, activity, goals, projects, habits, and quick actions.

### FR-002 Task Creation
The system shall allow a user to create a task with title, description, priority, due date/time, estimated duration, project, goal, tags, and subtasks.

### FR-003 Task Lifecycle
Tasks shall support Inbox, Planned, In Progress, Completed, and Cancelled states.

### FR-004 Task Views
The system shall provide All Tasks, Today, Upcoming, Inbox, Completed, and Overdue views.

### FR-005 Projects
The system shall allow project creation, editing, archiving, task association, progress display, deadlines, and activity history.

### FR-006 Goals
The system shall allow goals, milestones, deadlines, project associations, task associations, and progress tracking.

### FR-007 Calendar
The system shall support day, week, and month views and event/task scheduling.

### FR-008 Daily Planner
The system shall combine tasks, calendar items, goals, and available time into a daily planning interface.

### FR-009 Activity Tracking
The system shall allow start, pause, resume, stop, save, and history operations for activities.

### FR-010 Time Tracking
The system shall store start and end timestamps and calculate actual duration.

### FR-011 Habits
The system shall support habit creation, completion, history, consistency, and streaks.

### FR-012 Study
The system shall support course, subject, unit, topic, study session, and revision tracking.

### FR-013 Notes
The system shall support note creation, editing, deletion, search, tags, Markdown/rich text, and links to related entities.

### FR-014 Analytics
The system shall calculate task, time, project, goal, and habit metrics.

### FR-015 Daily Review
The system shall allow users to review completed work, focus time, goal progress, habits, and written reflections.

### FR-016 Local Persistence
The initial demo shall persist data locally so that browser refresh does not destroy the working state.

### FR-017 Backend
After frontend validation, the system shall migrate data to Supabase/PostgreSQL.

### FR-018 Authentication
Authentication shall be introduced after the core product is validated. There shall be no public registration.

### FR-019 Admin
Admin shall be able to create, enable, disable, and manage user accounts.

### FR-020 Mobile
The system shall provide responsive mobile UI and later PWA/Android packaging.

### FR-021 AI
AI functionality shall be added only after the core system is stable.

## 5. Non-Functional Requirements

### Performance
- Fast initial loading.
- Efficient database queries.
- Pagination for large datasets.
- Avoid unnecessary client-side rendering.

### Security
- Server-side validation.
- Role-based authorization.
- PostgreSQL Row Level Security.
- User data isolation.
- Secrets stored in environment variables.
- Service-role credentials never exposed to the browser.

### Usability
- Task creation should be quick.
- Primary actions should be discoverable.
- Dashboard should communicate today's priorities immediately.
- UI must be responsive.

### Accessibility
- Keyboard navigation.
- Visible focus states.
- Semantic HTML.
- Accessible labels.
- Adequate contrast.
- Touch-friendly controls.

## 6. Data Requirements

Core entities:

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

## 7. Acceptance Criteria

A feature is accepted when:
- Requirements are implemented.
- UI matches the approved design.
- Validation works.
- Loading, empty, success, and error states exist.
- Mobile layout works.
- Relevant tests pass.
- No critical security issue exists.


# 3. 03 UI UX

# Personal OS — UI/UX Design Document

**Version:** 2.0  
**Date:** August 2026

## 1. Design Direction

Modern, minimal, productivity-focused, mobile-first.

Priorities:
- Clarity
- Speed
- Low cognitive load
- Strong hierarchy
- Consistent interactions

## 2. Main Navigation

```text
Dashboard
Tasks
Calendar
Activities
Projects
Goals
Habits
Study
Notes
Analytics
Settings
```

Mobile navigation:

```text
Home | Tasks | Calendar | Activity | More
```

## 3. Main Dashboard

```text
Good evening

Today's Progress
███████████████░░ 75%

Today's Tasks
Today's Schedule
Current Activity
Goals
Habits
Active Projects
```

Quick actions:
- Add Task
- Start Activity
- Plan Day

## 4. Tasks

Views:
- All
- Today
- Upcoming
- Inbox
- Completed
- Overdue

Task creation:
- Title
- Description
- Priority
- Due date
- Due time
- Duration
- Project
- Goal
- Tags
- Subtasks

## 5. Calendar

Views:
- Day
- Week
- Month

The mobile version should use a vertical timeline.

## 6. Activities

Current activity screen:

```text
Mathematical Physics

00:42:18

[ Pause ] [ Stop ]
```

Activity history should show activity, duration, task/project, and date.

## 7. Projects

Project cards show:
- Name
- Progress
- Deadline
- Current task count

Project details show related tasks, goals, activities, and notes.

## 8. Goals

Goal details show:
- Progress
- Deadline
- Milestones
- Projects
- Tasks

## 9. Habits

Show today's habits and completion state without making streaks the only measure of success.

## 10. Study

```text
Course
 ↓
Subject
 ↓
Unit
 ↓
Topic
 ↓
Study Session
```

## 11. Notes

Notes support:
- Search
- Tags
- Markdown/rich text
- Links to tasks, projects, and study topics

## 12. Analytics

Display:
- Weekly task completion
- Focus/activity time
- Time distribution
- Goal progress
- Habit consistency

Avoid overly dense dashboards.

## 13. Daily Review

Show:
- Tasks completed
- Focus time
- Study time
- Goal progress
- Habit progress

Ask:
- What went well?
- What went wrong?
- What should improve?
- Tomorrow's priority?

## 14. Responsive Layout

Desktop:
- Left sidebar
- Top bar
- Main content

Mobile:
- Header
- Main content
- Bottom navigation

## 15. UX Rules

1. Create a task in under 10 seconds where possible.
2. Start an activity in under 5 seconds where possible.
3. Show today's priorities immediately.
4. Never rely only on color to communicate status.
5. Always make current location and next action clear.

## 16. Accessibility

Support:
- Keyboard navigation
- Screen readers
- Visible focus
- Accessible labels
- Touch targets
- Reduced motion
- Appropriate contrast

## 17. Demo Constraint

The first demo contains no sign-in page, authentication, Admin UI, Supabase, or AI. It uses mock/local data.


# 4. 04 SYSTEM ARCHITECTURE

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


# 5. 05 DEVELOPMENT PLAN

# Personal OS — Revised Development Plan

**Version:** 3.0  
**Date:** August 2026  
**Primary Focus:** Core productivity functionality first  
**Authentication:** Later phase

## 1. Development Strategy

```text
UI Foundation
 ↓
Core Productivity Features
 ↓
Activity & Time Tracking
 ↓
Goals & Progress
 ↓
Study & Habits
 ↓
Analytics
 ↓
Complete Demo
 ↓
Backend & Database
 ↓
Authentication
 ↓
Admin Account System
 ↓
Mobile/PWA
 ↓
AI & Automation
```

## 2. Phase 0 — Project Setup

- Create GitHub repository
- Create Next.js project
- Configure TypeScript
- Configure Tailwind
- Configure ESLint
- Create project structure
- Create README
- Create environment configuration

## 3. Phase 1 — Design System

Build reusable:
- Buttons
- Inputs
- Selects
- Checkboxes
- Toggles
- Cards
- Modals
- Dropdowns
- Tabs
- Toasts
- Progress bars
- Badges
- Avatars
- Tooltips
- Skeletons
- Empty states

## 4. Phase 2 — Application Shell

Build and connect:

```text
Dashboard
Tasks
Calendar
Activities
Projects
Goals
Habits
Study
Notes
Analytics
Settings
```

At this stage:

```text
NO LOGIN
NO AUTHENTICATION
NO ADMIN
NO SUPABASE
```

Use local/mock data.

## 5. Phase 3 — Dashboard

Build:
- Today's progress
- Today's tasks
- Today's schedule
- Current activity
- Goals
- Projects
- Habits
- Quick actions

## 6. Phase 4 — Task Management

Priority: P0

Implement:
- Create/edit/delete
- Complete/reopen
- Priority
- Deadline
- Duration
- Description
- Tags
- Subtasks
- Project association
- Goal association

Statuses:

```text
Inbox
Planned
In Progress
Completed
Cancelled
```

## 7. Phase 5 — Task Views

Create:
- All Tasks
- Today
- Upcoming
- Inbox
- Completed
- Overdue

Add search, filtering, and sorting.

## 8. Phase 6 — Projects

Implement:
- Create/edit/archive/delete
- Add tasks
- Progress
- Deadline
- Activity history

## 9. Phase 7 — Goals

Implement:
- Create/edit/archive
- Deadlines
- Milestones
- Project/task links
- Progress

Hierarchy:

```text
Goal → Project → Task
```

## 10. Phase 8 — Calendar

Implement:
- Day
- Week
- Month
- Events
- Task scheduling
- Deadlines
- Activities
- Study sessions

## 11. Phase 9 — Daily Planner

Combine:

```text
Tasks + Calendar + Goals + Available Time
```

Implement time blocking, priority selection, rearrangement, and rescheduling.

## 12. Phase 10 — Activity Tracking

Implement:
- Start
- Pause
- Resume
- Stop
- Save
- History
- Details

## 13. Phase 11 — Time Tracking

Store:
- Start time
- End time
- Estimated duration
- Actual duration

Calculate duration from timestamps.

## 14. Phase 12 — Activity History

Views:
- Today
- Yesterday
- This Week
- This Month

## 15. Phase 13 — Habits

Priority: P1

Implement creation, editing, archiving, daily completion, weekly completion, streaks, and history.

## 16. Phase 14 — Study

Build:

```text
Course
 ↓
Subject
 ↓
Unit
 ↓
Topic
 ↓
Study Session
 ↓
Revision
```

## 17. Phase 15 — Notes

Implement:
- Create/edit/delete
- Search
- Tags
- Markdown/rich text
- Links to tasks, projects, and study topics

## 18. Phase 16 — Analytics

Priority: P0

Build:
- Task completion
- Pending/overdue
- Focus time
- Time distribution
- Goal progress
- Habit consistency

## 19. Phase 17 — Daily Review

Show:
- Tasks completed
- Focus time
- Study time
- Goal progress
- Habit progress

Collect reflections and tomorrow's priority.

## 20. Phase 18 — Complete Frontend Demo

The demo should support:

```text
Open App
 ↓
Dashboard
 ↓
Create Goal
 ↓
Create Project
 ↓
Create Task
 ↓
Schedule Task
 ↓
Start Activity
 ↓
Track Time
 ↓
Complete Task
 ↓
View Progress
 ↓
Review Day
```

No authentication.

## 21. Phase 19 — Local Persistence

Use LocalStorage initially, or a structured client-side storage layer when data complexity requires it.

The demo should survive refresh and restart.

## 22. Phase 20 — UX Testing

Validate:
- Navigation
- Task creation speed
- Daily planning
- Activity timer
- Analytics clarity
- Mobile usability

## 23. Phase 21 — Backend Architecture

Only after the frontend demo is stable introduce:
- Supabase
- PostgreSQL
- Storage
- Server-side operations

## 24. Phase 22 — Database

Create:

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

## 25. Phase 23 — Backend Integration

Replace mock data with:

```text
UI
 ↓
Service
 ↓
Supabase
 ↓
PostgreSQL
```

## 26. Phase 24 — Data Security

Implement:
- Row Level Security
- User data isolation
- Server-side validation
- API authorization
- Secure environment variables

## 27. Phase 25 — Authentication

Only after the core product and backend work.

There is still **NO PUBLIC SIGNUP**.

## 28. Phase 26 — Admin

Build:
- Admin Login
- Admin Dashboard
- User Management
- Create User
- Generate Credentials
- Enable/disable users
- Reset passwords
- Audit operations

## 29. Phase 27 — RBAC

Roles:

```text
ADMIN
USER
```

Admin routes require Admin authorization. User data access must also be enforced at the database level.

## 30. Phase 28 — Mobile/PWA

After real-data web functionality is stable:

```text
Responsive Web
 ↓
PWA
 ↓
Android
```

## 31. Phase 29 — Testing

### Unit
- Task logic
- Goal progress
- Habit streaks
- Timer calculations
- Analytics

### Integration
- Database
- Services
- Authentication
- Admin account creation

### E2E
Test the full Admin → User → Task → Project → Goal → Activity → Analytics workflow.

## 32. Phase 30 — Security Audit

Check:
- RLS
- RBAC
- API authorization
- Input validation
- Session security
- Admin protection
- Service-role key
- AI API keys
- User data isolation

## 33. Phase 31 — Performance

Optimize:
- Database queries
- API calls
- Rendering
- Bundle size
- Analytics
- Large task lists
- Activity history

## 34. Phase 32 — Deployment

Recommended:

```text
GitHub
 ↓
Vercel
 ↓
Next.js
 ↓
Supabase
```

## 35. Phase 33 — AI

After the real application is stable:
- Natural-language task creation
- Task breakdown
- Daily planning
- Daily review
- Weekly productivity analysis

## 36. Phase 34 — Automation

Future automation examples:

```text
Task Created → Suggest Schedule
Deadline Approaching → Suggest Priority
Goal Falling Behind → Alert User
Daily End → Generate Review
```

## 37. Priority Matrix

| Feature | Priority | Phase |
|---|---:|---:|
| UI Foundation | P0 | 1 |
| Dashboard | P0 | 3 |
| Tasks | P0 | 4 |
| Projects | P0 | 6 |
| Goals | P0 | 7 |
| Calendar | P0 | 8 |
| Daily Planner | P0 | 9 |
| Activities | P0 | 10 |
| Time Tracking | P0 | 11 |
| Analytics | P0 | 16 |
| Daily Review | P0 | 17 |
| Habits | P1 | 13 |
| Study | P1 | 14 |
| Notes | P1 | 15 |
| Backend | P0 | 21 |
| Database | P0 | 22 |
| Authentication | P1 | 25 |
| Admin | P1 | 26 |
| Mobile/PWA | P1 | 28 |
| AI | P2 | 33 |
| Automation | P2 | 34 |

## 38. MVP Milestones

### Milestone 1 — UI Prototype

```text
✓ Design system
✓ Navigation
✓ Dashboard
✓ Tasks
✓ Calendar
✓ Activities
✓ Projects
✓ Goals
✓ Habits
✓ Study
✓ Notes
✓ Analytics
```

### Milestone 2 — Functional Demo

```text
✓ Create tasks
✓ Complete tasks
✓ Create projects
✓ Create goals
✓ Schedule work
✓ Track activities
✓ Track time
✓ View analytics
✓ Daily review
✓ Local persistence
```

### Milestone 3 — Real Backend

```text
✓ Supabase
✓ PostgreSQL
✓ Database relationships
✓ RLS
✓ Backend services
```

### Milestone 4 — Secure Application

```text
✓ Authentication
✓ Admin
✓ User management
✓ RBAC
✓ Account generation
```

### Milestone 5 — Mobile

```text
✓ Responsive
✓ PWA
✓ Android
```

### Milestone 6 — Intelligence

```text
✓ AI assistant
✓ Smart planning
✓ Automation
```

## 39. Critical Development Rule

Do **not** make authentication the first milestone.

The first meaningful milestone is:

```text
Open Personal OS
 ↓
See Dashboard
 ↓
Create Task
 ↓
Create Project
 ↓
Create Goal
 ↓
Schedule Task
 ↓
Start Activity
 ↓
Track Time
 ↓
Complete Task
 ↓
See Progress
```

## 40. Final Development Philosophy

```text
PRODUCT FIRST
 ↓
UI/UX FIRST
 ↓
CORE FUNCTIONALITY
 ↓
WORKING DEMO
 ↓
USER EXPERIENCE TEST
 ↓
BACKEND
 ↓
REAL DATABASE
 ↓
AUTHENTICATION
 ↓
ADMIN
 ↓
MOBILE
 ↓
AI
 ↓
AUTOMATION
```

The first goal is to build a **useful Personal OS**, not an account-management system.
