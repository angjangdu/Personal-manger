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
