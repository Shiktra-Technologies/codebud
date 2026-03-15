# CODE BUD — Mega Feature Plan

## Three Workstreams

| # | Feature | Priority | Scope |
|---|---------|----------|-------|
| 1 | **Company Dashboard & Job System** | HIGH | New role (`company`), new routes, full backend |
| 2 | **Dynamic Course System** | HIGH | Super Admin creates courses, replaces all static data |
| 3 | **Super Admin Secret-Code Shortcut Fix** | CRITICAL (quick fix) | Restore `Ctrl+Shift+S` on auth page |

---

## Current State Summary (what exists today)

```
Auth Roles:     student, mentor, admin, super_admin
Backend:        Flask (server/app.py) — 34 routes, MongoDB Atlas
Frontend:       Next.js 15 App Router (website/src/app/)
Jobs:           localStorage only (jobService.js) — no backend persistence
Courses:        100% hardcoded array in dashboard CoursesTab (3 dummy courses)
Super Admin:    Auth page has NO shortcut (Ctrl+Shift+S was removed during auth rewrite)
                useAuth.tsx still has superAdminLogin() function — just no UI trigger
```

---

# Workstream 1: Company Dashboard & Job System

## 1.1 New Role: `company`

A **company** user represents an organisation that can post jobs, review applicants, and manage their company profile. This is a net-new role alongside the existing four.

**Auth flow:** Companies **sign up on the auth page** (new "Company" sign-up tab) or are **created by Super Admin**. They log in normally — server auto-detects role.

## 1.2 Proposed Features

### Company Dashboard (`/company`)

| Feature | Description |
|---------|-------------|
| **Company Profile** | Logo, name, description, website, industry, size, location, social links |
| **Job Posting CRUD** | Create / Edit / Delete job postings (persisted in MongoDB, not localStorage) |
| **Job Templates** | Save reusable templates for common roles |
| **Application Management** | View all applications per job, filter by status (Applied / Screening / Interview / Offered / Rejected) |
| **Applicant Profiles** | View student profile, resume, skills, code submissions, aptitude scores |
| **Interview Scheduling** | Set interview slots, students pick time (basic calendar) |
| **Analytics** | Views per posting, application count, conversion funnel, time-to-hire |
| **Shortlist / Bookmark** | Shortlist promising students across jobs |
| **Notifications** | Get notified when students apply |
| **Bulk Actions** | Reject / advance multiple applicants at once |

### Student-Side Job Features (enhance existing `/dashboard` Jobs tab)

| Feature | Description |
|---------|-------------|
| **Browse Jobs** | Search, filter by type/location/salary/company, sort |
| **Job Detail Page** | Full description, requirements, company info, apply button |
| **Apply to Job** | One-click apply with profile, optional cover note |
| **Application Tracker** | See status of all applications (Applied → Screening → Interview → Offered/Rejected) |
| **Save Jobs** | Bookmark jobs for later |
| **Recommended Jobs** | Based on skills, course completions, DSA performance |

### Admin/Super-Admin Side

| Feature | Description |
|---------|-------------|
| **Company Management** | View/approve/suspend company accounts |
| **Job Moderation** | Review flagged or reported job postings |
| **Platform Job Stats** | Total jobs, total applications, placement rate |

## 1.3 Database Schema (MongoDB Collections)

```
companies
├── _id
├── user_id          → links to users._id (role=company)
├── name
├── logo_url
├── description
├── website
├── industry
├── size             (startup / small / medium / large / enterprise)
├── location
├── social_links     { linkedin, twitter, github }
├── verified         (boolean — admin can verify)
├── created_at
└── updated_at

jobs
├── _id
├── company_id       → links to companies._id
├── title
├── description      (rich text / markdown)
├── requirements     [string]
├── skills_required  [string]
├── type             (full-time / part-time / internship / contract / remote)
├── location
├── salary_range     { min, max, currency }
├── experience_level (entry / mid / senior)
├── application_deadline
├── is_active        (boolean)
├── views_count
├── created_at
└── updated_at

applications
├── _id
├── job_id           → links to jobs._id
├── student_id       → links to users._id (role=student)
├── company_id       → links to companies._id
├── status           (applied / screening / interview / offered / rejected / withdrawn)
├── cover_note
├── resume_url
├── status_history   [{ status, changed_at, changed_by }]
├── interview_slot   { date, time, link }
├── notes            (internal company notes)
├── created_at
└── updated_at
```

## 1.4 Backend API Routes (new)

```
# Company Profile
POST   /api/company/profile            → Create company profile
GET    /api/company/profile             → Get own company profile
PATCH  /api/company/profile             → Update company profile
GET    /api/company/profile/:id         → Public company profile

# Job CRUD
POST   /api/jobs                        → Create job posting (company)
GET    /api/jobs                        → List jobs (public, with filters)
GET    /api/jobs/:id                    → Get job details
PATCH  /api/jobs/:id                    → Update job (company owner)
DELETE /api/jobs/:id                    → Delete job (company owner)

# Applications
POST   /api/jobs/:id/apply              → Student applies
GET    /api/jobs/:id/applications       → Company views applications for a job
GET    /api/applications/me             → Student views own applications
PATCH  /api/applications/:id/status     → Company updates application status
POST   /api/applications/:id/interview  → Schedule interview

# Admin
GET    /api/admin/companies             → List all companies
PATCH  /api/admin/companies/:id/verify  → Verify/suspend company
GET    /api/admin/job-stats             → Platform-wide job analytics
```

## 1.5 Frontend File Structure (new)

```
website/src/app/
├── (platform)/
│   ├── company/
│   │   └── page.tsx                     → Company Dashboard
│   │       _components/
│   │       ├── CompanyProfileTab.tsx
│   │       ├── JobPostingsTab.tsx
│   │       ├── ApplicationsTab.tsx
│   │       ├── AnalyticsTab.tsx
│   │       └── InterviewsTab.tsx
│   ├── jobs/
│   │   ├── page.tsx                     → Public job board (browse/search)
│   │   └── [id]/
│   │       └── page.tsx                 → Job detail + apply
│   ├── dashboard/
│   │   └── page.tsx                     → Enhanced Jobs tab (tracker, saved, recommended)
│   └── admin/
│       └── _components/
│           ├── JobsTab.tsx              → REWRITE (backend-backed, not localStorage)
│           └── CompaniesTab.tsx         → NEW (company management)

website/src/lib/
├── services/
│   ├── companyService.ts                → NEW
│   ├── jobService.ts                    → REWRITE (API calls, not localStorage)
│   └── applicationService.ts            → NEW
```

## 1.6 Middleware Updates

```typescript
// middleware.ts additions:
// /company/*  → requires valid JWT with role company, admin, or super_admin
// /jobs, /jobs/* → public (no auth required) for browsing
```

---

# Workstream 2: Dynamic Course System

## 2.1 Overview

Replace ALL hardcoded course data with a fully dynamic system managed by **Super Admin** (and optionally Admin). Courses are created, structured, and published from the Super Admin dashboard.

## 2.2 Proposed Features

### Super Admin — Course Builder

| Feature | Description |
|---------|-------------|
| **Course CRUD** | Create / Edit / Delete / Archive courses |
| **Course Structure** | Course → Sections → Lessons (drag-and-drop reorder) |
| **Lesson Types** | Video (URL embed), Text/Markdown, Code Challenge, Quiz, Assignment |
| **Rich Text Editor** | Markdown editor with preview for lesson content |
| **Course Metadata** | Title, description, thumbnail, difficulty (beginner/intermediate/advanced), estimated duration, tags/skills, instructor name |
| **Pricing Tier** | Free / Pro / Team (controls visibility per pricing plan) |
| **Publish/Draft** | Courses start as draft, publish when ready |
| **Course Ordering** | Control display order on the student dashboard |
| **Duplicate Course** | Clone existing course as template |
| **Bulk Operations** | Archive / publish multiple courses |

### Student — Course Experience

| Feature | Description |
|---------|-------------|
| **Course Catalog** | `/courses` page: browse all published courses, filter by difficulty/tag/duration |
| **Course Detail** | `/courses/:id` page: syllabus, lesson list, enroll button |
| **Lesson Player** | `/courses/:id/lessons/:lessonId` — render lesson based on type (video/text/code/quiz) |
| **Progress Tracking** | Mark lessons complete, auto-track per user, resume where you left off |
| **Course Completion** | Certificate / badge when all lessons done |
| **Ratings & Reviews** | Students can rate and review courses |
| **Notes** | Personal notes per lesson |

### Admin Dashboard Enhancements

| Feature | Description |
|---------|-------------|
| **Course Analytics** | Enrollment count, completion rate, avg time, drop-off points |
| **Student Progress** | View which students are enrolled and their % progress |

## 2.3 Database Schema (MongoDB Collections)

```
courses
├── _id
├── title
├── description        (markdown)
├── thumbnail_url
├── difficulty          (beginner / intermediate / advanced)
├── estimated_hours
├── tags               [string] (e.g., "javascript", "algorithms")
├── instructor_name
├── pricing_tier       (free / pro / team)
├── is_published       (boolean)
├── display_order      (number for sorting)
├── sections           [{
│   ├── _id
│   ├── title
│   ├── order
│   └── lessons       [{
│       ├── _id
│       ├── title
│       ├── type        (video / text / code_challenge / quiz / assignment)
│       ├── content     (markdown text or video URL or quiz JSON)
│       ├── duration_minutes
│       └── order
│   }]
│ }]
├── created_by
├── created_at
└── updated_at

enrollments
├── _id
├── user_id
├── course_id
├── progress           { completed_lessons: [lessonId], current_lesson_id, percentage }
├── started_at
├── completed_at       (null until finished)
├── certificate_id     (null until earned)
└── updated_at

course_reviews
├── _id
├── user_id
├── course_id
├── rating             (1-5)
├── review_text
├── created_at
└── updated_at
```

## 2.4 Backend API Routes (new)

```
# Course CRUD (Super Admin / Admin)
POST   /api/courses                      → Create course
GET    /api/courses                      → List courses (public: published only, admin: all)
GET    /api/courses/:id                  → Get course (with sections/lessons)
PATCH  /api/courses/:id                  → Update course
DELETE /api/courses/:id                  → Delete course
PATCH  /api/courses/:id/publish          → Publish / unpublish
PATCH  /api/courses/:id/reorder          → Reorder sections/lessons

# Enrollment (Student)
POST   /api/courses/:id/enroll           → Enroll in course
GET    /api/enrollments/me               → My enrolled courses with progress
POST   /api/courses/:id/lessons/:lid/complete → Mark lesson complete
GET    /api/courses/:id/progress         → Get my progress for a course

# Reviews
POST   /api/courses/:id/reviews          → Add review
GET    /api/courses/:id/reviews          → List reviews

# Admin Analytics
GET    /api/admin/course-stats           → Platform course analytics
GET    /api/courses/:id/analytics        → Per-course analytics
```

## 2.5 Frontend File Structure (new)

```
website/src/app/
├── (platform)/
│   ├── courses/
│   │   ├── page.tsx                      → Course catalog (browse/filter)
│   │   └── [id]/
│   │       ├── page.tsx                  → Course detail (syllabus, enroll)
│   │       └── lessons/
│   │           └── [lessonId]/
│   │               └── page.tsx          → Lesson player
│   ├── super-admin/
│   │   └── page.tsx                      → ADD Courses tab with course builder
│   └── dashboard/
│       └── page.tsx                      → REWRITE CoursesTab (fetch from API)

website/src/lib/
├── services/
│   ├── courseService.ts                   → NEW
│   └── enrollmentService.ts              → NEW
```

## 2.6 Super Admin Dashboard Changes

Add a **Courses** tab to the Super Admin dashboard:

```
Super Admin Dashboard Tabs:
├── System Overview      (existing)
├── User Management      (existing)
├── Course Management    (NEW)
│   ├── Course list with search/filter
│   ├── "Create Course" button → opens course builder
│   ├── Course Builder:
│   │   ├── Basic info form (title, description, difficulty, tags, pricing tier)
│   │   ├── Section manager (add/reorder/delete sections)
│   │   ├── Lesson manager per section (add/reorder/delete lessons)
│   │   ├── Lesson editor (type selector + content editor)
│   │   └── Publish / Save Draft toggle
│   └── Course analytics per course
```

---

# Workstream 3: Super Admin Secret-Code Shortcut Fix

## 3.1 Problem

During the recent auth page rewrite, the **Ctrl+Shift+S** keyboard shortcut (which revealed a secret code input for super admin login) was **removed**. The auth page now has no way to access super admin login from the UI.

## 3.2 What Still Works

- `useAuth.tsx` → `superAdminLogin(password)` function **still exists** and works
- Backend → handles super admin signup/login correctly
- The super admin account is `super_admin@codebud.dev` with password `codebud_super_admin_2025`

## 3.3 Fix Plan

Add back to [auth/page.tsx](website/src/app/auth/page.tsx):

1. **State:** `showSuperAdmin` (boolean, default false), `secretCode` (string)
2. **Keyboard listener:** `useEffect` with `keydown` handler — when `Ctrl+Shift+S` is pressed, toggle `showSuperAdmin`
3. **UI:** When `showSuperAdmin` is true, show a minimal secret-code input below the main form with a "Super Admin Login" button
4. **Handler:** On submit, call `superAdminLogin(secretCode)` → redirect to `/super-admin`

**Estimated effort:** ~30 lines of code, 5 minutes.

---

# Implementation Order (Recommended)

```
Phase 0 — Quick Fix (30 min)
  └── Fix Ctrl+Shift+S super admin shortcut on auth page

Phase 1 — Course Backend (1-2 days)
  ├── MongoDB collections: courses, enrollments, course_reviews
  ├── Course CRUD API routes (app.py)
  ├── courseService.ts + enrollmentService.ts
  └── Seed 3-5 sample courses

Phase 2 — Course Super Admin UI (2-3 days)
  ├── Course Management tab in Super Admin dashboard
  ├── Course Builder (sections → lessons, drag-drop reorder)
  ├── Lesson type editors (text/video/code/quiz)
  └── Publish/Draft toggle

Phase 3 — Course Student Experience (2-3 days)
  ├── /courses catalog page
  ├── /courses/:id detail page
  ├── /courses/:id/lessons/:lid player page
  ├── Progress tracking + completion
  └── REWRITE dashboard CoursesTab (API-backed)

Phase 4 — Company Backend (1-2 days)
  ├── Add "company" role to auth system
  ├── MongoDB collections: companies, jobs, applications
  ├── Company profile + Job CRUD + Application API routes
  ├── companyService.ts + applicationService.ts
  └── REWRITE jobService.ts (API-backed, remove localStorage)

Phase 5 — Company Dashboard (2-3 days)
  ├── /company dashboard (profile, job postings, applications, analytics)
  ├── Application status management
  ├── Interview scheduling
  └── Middleware route guard for /company/*

Phase 6 — Student Job Experience (1-2 days)
  ├── /jobs public job board
  ├── /jobs/:id detail + apply
  ├── Application tracker in student dashboard
  └── Recommended jobs

Phase 7 — Admin Enhancements (1 day)
  ├── CompaniesTab in admin dashboard
  ├── REWRITE JobsTab (backend-backed)
  ├── Course analytics in admin
  └── Platform-wide stats (jobs + courses)
```

**Total estimated time: ~10-15 days** (one developer, full-time)

---

# Questions to Clarify Before Coding

1. **Company sign-up flow:** Should companies sign up themselves on the auth page (new "I'm a Company" option), or should only Super Admin/Admin create company accounts?

2. **Course content types priority:** Which lesson types do you want in **v1**? All five (video, text, code challenge, quiz, assignment) or start with a subset like text + video + code challenge?

3. **Pricing integration:** The Pricing page mentions "5 Beginner Courses" for free, "All 50+ Courses" for Pro. Should course visibility actually be gated by pricing tier, or is that just marketing text for now?

4. **Job applications:** Should students upload a resume file, or just apply with their profile data? (Resume upload needs file storage — S3 or similar.)

5. **Company verification:** Should companies need admin approval before they can post jobs, or can they post immediately after sign-up?

6. **Course certificates:** Just a UI badge/status, or a downloadable PDF certificate?

7. **Priority:** Which workstream should we start coding first — Courses (since it's used by all students) or Company Dashboard (since CTO requested it)?
