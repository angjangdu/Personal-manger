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
