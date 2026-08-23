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
