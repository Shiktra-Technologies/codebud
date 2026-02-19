# Feature Comparison Report: CRA → Next.js Migration

**Generated:** 18 February 2026  
**CRA (old):** `src/components/` + `src/services/` + `src/utils/` + `src/context/` + `src/config/`  
**Next.js (new):** `website/src/`

---

## Executive Summary

| Category | Fully Ported ✅ | Partially Ported ⚠️ | Missing ❌ |
|----------|:-:|:-:|:-:|
| Student Dashboard | 1 | 0 | 0 |
| Admin Dashboard | 1 | 0 | 0 |
| Super Admin Dashboard | 0 | 0 | 1 |
| Authentication | 1 | 0 | 0 |
| Aptitude Test | 1 | 0 | 0 |
| DSA Test | 1 | 0 | 0 |
| Problems/ProblemSolver | 0 | 1 | 0 |
| Profile | 0 | 1 | 0 |
| Submissions | 0 | 1 | 0 |
| Proctoring (Proctor + Violations) | 1 | 0 | 0 |
| Permissions | 1 | 0 | 0 |
| Navigation (Navbar/Sidebar) | 1 | 0 | 0 |
| Home / Marketing | 1 | 0 | 0 |
| Loading / Error | 1 | 0 | 0 |
| Services | 0 | 1 | 0 |
| Utils | 0 | 1 | 0 |
| Hooks | 1 | 0 | 0 |
| Context | 0 | 1 | 0 |
| Config | 0 | 1 | 0 |
| Dev/Test Components | 0 | 0 | 4 |
| **TOTAL** | **11** | **7** | **5** |

---

## 1. Student Dashboard

**CRA:** `StudentDashboard.js` (760 lines)  
**Next.js:** `website/src/app/(platform)/dashboard/page.tsx` (1577 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js | Notes |
|---------|-----|---------|-------|
| Assessments tab (Aptitude + DSA cards) | ✅ | ✅ | Redesigned with Framer Motion |
| Courses section | ✅ | ✅ | Same mock data approach |
| Leaderboard section | ✅ | ✅ | Uses `leaderboardService` |
| Job Opportunities section | ✅ | ✅ | Uses `jobService` |
| User rank display | ✅ | ✅ | `leaderboardService.getUserRank()` |
| Real-time leaderboard updates | ✅ | ✅ | Polling-based |
| Job apply & save | ✅ | ✅ | `jobService.applyForJob()` |
| Assessment guidelines/tips | ✅ | ✅ | Present |
| Role-based access (student guard) | ✅ | ✅ | Via `useAuth()` + platform layout guard |
| Hero section with user greeting | ✅ | ✅ | Redesigned |
| Navigation tabs | ✅ | ✅ | Redesigned with `tabItems` array |
| Scroll animations | ✅ | ✅ | CRA uses IntersectionObserver; Next.js uses Framer Motion |
| **Submissions history (Overview tab)** | ❌ N/A | ✅ | **New** — Next.js added an "Overview" tab with recent submissions |
| **Stat cards (tests taken, avg score, etc.)** | ❌ N/A | ✅ | **New** — Next.js added stat cards |
| **Profile dropdown in header** | ❌ N/A | ✅ | **New** — inline nav + profile dropdown |
| **Refresh data button** | ❌ N/A | ✅ | **New** |

**Verdict:** ✅ Fully ported. Next.js version is **more feature-rich** with Overview tab, inline profile nav, and stat cards.

---

## 2. Admin Dashboard

**CRA:** `AdminDashboard.js` (2928 lines) + `Sidebar.js` (334 lines)  
**Next.js:** `website/src/app/(platform)/admin/page.tsx` (456 lines) + 8 tab sub-components

### ✅ Fully Ported

| Tab / Feature | CRA | Next.js | Notes |
|---------------|-----|---------|-------|
| Students management | ✅ (inline) | ✅ `StudentsTab.tsx` (173 lines) | Standalone component, search + list |
| Active users monitoring | ✅ (inline) | ✅ `ActiveUsersTab.tsx` (329 lines) | Accepts real-time data as props |
| Submissions management | ✅ (inline) | ✅ `SubmissionsTab.tsx` (199 lines) | Fetch + search + filter |
| Leaderboard | ✅ (inline) | ✅ `LeaderboardTab.tsx` (146 lines) | `leaderboardService.getTopUsers(50)` |
| Job posting management (CRUD) | ✅ (inline) | ✅ `JobsTab.tsx` (195 lines) | Create + delete + list |
| CSV reports/export | ✅ (inline) | ✅ `CSVReportsTab.tsx` (159 lines) | Download + search via `adminCSVService` |
| Debug tools | ✅ (inline) | ✅ `DebugTab.tsx` (183 lines) | Backend health check via `apiClient` |
| Settings | ✅ (inline) | ✅ `SettingsTab.tsx` (100 lines) | Platform, DB, Security, Notification settings |
| Sidebar navigation (collapsible) | ✅ `Sidebar.js` | ✅ Built into admin page | Groups: Main, Academic, Operations, System |
| Real-time data fetching | ✅ `fetchRealTimeData()` | ✅ `useRealTime()` hook | Cleaner with a dedicated hook |
| Profile dropdown | ✅ | ✅ | |
| Role guard (admin/super_admin) | ✅ | ✅ | `useEffect` redirect if wrong role |
| Mobile sidebar responsive | ✅ | ✅ | Mobile sheet sidebar |

**Architecture improvement:** CRA had everything in one 2928-line file. Next.js properly decomposed into 8 separate tab components + a `useRealTime` hook.

| CRA Feature | CRA Detail | Next.js Equivalent | Status |
|-------------|-----------|---------------------|--------|
| Job form modal | Full create form with company, position, location, type, salary, description, requirements | `JobsTab.tsx` — similar form fields | ✅ |
| Submission filtering (by type, date, score) | `getFilteredSubmissions()` + `searchCriteria` (searchText, startDate, endDate, minScore, maxScore, deviceType, hasViolations) | `SubmissionsTab.tsx` — search + filterType (all / passed / failed) | ⚠️ Simpler — missing advanced filters (date range, score range, device type, violations flag) |
| CSV stats dashboard | `csvStats`, `csvData` state objects from `adminCSVService` | `CSVReportsTab.tsx` — download + search only | ⚠️ Missing stats dashboard view |
| Real-time status indicator | `realTimeStatus` (connecting/connected/error) | `status` from `useRealTime` hook | ✅ |

**Verdict:** ✅ Fully ported (all major tabs exist). Minor submission filtering simplification.

---

## 3. Super Admin Dashboard

**CRA:** `SuperAdminDashboard.js` (480 lines)  
**Next.js:** **No dedicated page exists** (no `/super-admin/` route)

### ❌ Completely Missing

| Feature | Status |
|---------|--------|
| System Overview tab (total users, students, admins, super admins, submissions, violations, pass rate) | ❌ |
| System Health indicators (Auth, DB, Proctoring, Performance) | ❌ |
| User Management tab (table with role, status, created, last login, actions) | ❌ |
| Role change modal (change user role with confirmation) | ❌ |
| User deactivation | ❌ |
| User search/filter | ❌ |
| Embedded Admin Dashboard (admin view tab) | ❌ |
| Permission display per user | ❌ |

**Notes:** The auth system (`useAuth.tsx`) has `superAdminLogin()` and the auth page supports super admin login via secret code, but **there is no destination page**. The login redirects to `/super-admin` which doesn't exist.

**Verdict:** ❌ The Super Admin Dashboard is **completely missing** from the Next.js codebase.

---

## 4. Authentication

**CRA:** `Login.js` (270 lines) + `Signup.js` (191 lines) + `AuthPage.js` (38 lines)  
**Next.js:** `website/src/app/auth/page.tsx` (456 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Email/password login | ✅ | ✅ |
| Email/password signup | ✅ | ✅ |
| Role selection (Student/Admin) | ✅ | ✅ |
| Super Admin login (Ctrl+Shift+S) | ✅ | ✅ |
| Test account detection & login | ✅ | ✅ |
| Error handling (invalid creds, not confirmed, etc.) | ✅ | ✅ |
| Email confirmation flow | ✅ | ✅ |
| Toggle login/signup mode | ✅ | ✅ |
| Google sign-in | ❌ Disabled | ❌ Not present |
| Display name field in signup | ✅ | ❌ Missing |
| Confirm password field in signup | ✅ | ❌ Missing |
| Show/hide password toggle | ❌ | ✅ (new) |
| Animated backgrounds | ❌ | ✅ (FloatingHex) |

**Architecture change:** CRA uses **Supabase auth** directly (`SimpleAuthContext.js`). Next.js uses **JWT-based auth via a custom backend** (`apiClient.js` → `/api/auth/*` endpoints on MongoDB).

**Verdict:** ✅ Fully ported. Auth page is more polished. Missing display name + confirm password fields in signup.

---

## 5. Aptitude Test

**CRA:** `AptitudeTest.js` (582 lines)  
**Next.js:** `website/src/app/(platform)/aptitude-test/page.tsx` (472 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Questions bank (30 questions) | ✅ | ✅ (30 questions) |
| Timer (countdown) | ✅ 90 min | ✅ 45 min |
| Answer selection | ✅ | ✅ |
| Question navigation (prev/next) | ✅ | ✅ |
| Proctoring integration | ✅ `useProctor()` | ✅ `useProctor()` |
| Violation modal + warning popup | ✅ | ✅ |
| Auto-submit on violations | ✅ | ✅ |
| Auto-submit on timer expiry | ✅ | ✅ |
| Score calculation & result display | ✅ | ✅ |
| Submission to backend | ✅ `submissionForwardingService` | ✅ `submitTest()` |
| Question flagging | ❌ | ✅ (new) |
| Question start time tracking | ✅ | ❌ (removed) |
| Auto-start from permissions page | ❌ | ✅ (`?start=true`) |

**Verdict:** ✅ Fully ported. Different timer duration. Next.js adds question flagging.

---

## 6. DSA Test

**CRA:** `DSATest.js` (274 lines)  
**Next.js:** `website/src/app/(platform)/dsa-test/page.tsx` (554 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Problem loading from server | ✅ `dsaService.getProblems()` | ✅ `dsaService.getProblems()` |
| Code editor | ✅ (textarea) | ✅ (textarea, multi-language) |
| Code execution | ✅ `dsaService.executeCode()` | ✅ `dsaService.executeCode()` |
| Server health check | ✅ | ✅ |
| Language selection | ❌ (single) | ✅ Python/JS/Java/C++ |
| Problem switching | ✅ | ✅ |
| Proctoring integration | ❌ | ✅ (new) |
| Violation handling | ❌ | ✅ (new) |
| Timer | ❌ | ✅ 90 min timer (new) |
| Score tracking (solved problems) | ❌ | ✅ (new) |
| Submission to backend | ❌ | ✅ `submitTest()` (new) |
| Default problems fallback | ❌ | ✅ (new) |
| Auto-start from permissions | ❌ | ✅ (new) |

**Verdict:** ✅ Fully ported and **significantly enhanced**. Next.js adds proctoring, multi-language, timer, scoring, and submission.

---

## 7. Problem List / Problem Solver

**CRA:** `ProblemList.js` (310 lines) + `ProblemSolver.js` (850 lines)  
**Next.js:** `website/src/app/(platform)/problems/page.tsx` (244 lines)

### ⚠️ Partially Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Problem listing with difficulty filter | ✅ | ✅ |
| Search by title | ✅ | ✅ |
| Difficulty badges (Easy/Medium/Hard) | ✅ | ✅ |
| Stats (total/easy/medium/hard/solved) | ✅ | ✅ |
| Solved indicator per problem | ✅ | ✅ |
| Tags display | ✅ | ✅ |
| **Full problem solver page** | ✅ `ProblemSolver.js` (Monaco Editor, multi-lang, test cases, proctoring, violation handling, real-time activity, submission forwarding) | ❌ **Missing** |
| Monaco Editor integration | ✅ `@monaco-editor/react` | ❌ |
| In-problem code execution + test cases | ✅ (with server calls) | ❌ |
| Problem detail view (description, examples, constraints, starter code) | ✅ | ❌ |

**What's missing:** The `ProblemSolver.js` is a **full 850-line component** with Monaco Editor, multi-language support, test case display, real-time activity tracking, violation monitoring, and submission forwarding. The Next.js `problems/page.tsx` only shows the **problem list** — clicking a problem links to `/dsa-test`, not a dedicated solver page.

**Verdict:** ⚠️ Partially ported. Problem list exists but the dedicated ProblemSolver page is missing.

---

## 8. Profile

**CRA:** `Profile.js` (221 lines)  
**Next.js:** `website/src/app/(platform)/profile/page.tsx` (304 lines)

### ⚠️ Partially Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Display name, email, role | ✅ | ✅ |
| Account creation date | ✅ | ❌ |
| Submission stats (total, passed, avg score, DSA/aptitude count) | ❌ | ✅ (new, richer) |
| Rank display | ❌ | ✅ (new) |
| Latest submission info | ❌ | ✅ (new) |
| Edit display name | ❌ | ✅ (new) |
| Test account information section | ✅ (roll no, class, section, dept) | ❌ |
| Test account controls (promote to admin, reset) | ✅ | ❌ |
| Password reset button | ✅ | ❌ |
| Profile update form | ✅ (disabled note) | ❌ |
| Logout button | ❌ | ✅ (new) |

**Verdict:** ⚠️ Partially ported. Next.js profile is **better** overall (stats, rank, edit name) but drops test-account-specific info and password reset.

---

## 9. Submission Page

**CRA:** `SubmissionPage.js` (369 lines) + `SubmissionFilters.js` (379 lines)  
**Next.js:** `website/src/app/(platform)/submitted/page.tsx` (228 lines)

### ⚠️ Partially Ported

| Feature | CRA SubmissionPage | Next.js submitted/page |
|---------|-------------------|----------------------|
| Show test results after submission | ✅ (loads from localStorage) | — (different approach) |
| Violation details display | ✅ (violation count, category, timeline) | ❌ |
| CSV forwarding of submission | ✅ `submissionForwardingService` | ❌ |
| Performance summary card | ✅ | ❌ |
| Time analysis (total, avg per question) | ✅ | ❌ |
| Navigation buttons (retake, dashboard) | ✅ | ✅ |
| **Submissions list page** | ❌ (single result) | ✅ (list all submissions) |
| Submissions search + filter by type | ❌ | ✅ |
| Stats (total, avg score, passed count) | ❌ | ✅ |
| Admin vs student view | ❌ | ✅ (admin sees all) |

**CRA SubmissionFilters** features missing from Next.js:
- Advanced filters: date range (custom), min/max score, file type, user ID, sort options
- Filter presets (today, this week, last month)
- Filter count badges

**Key difference:** CRA's `SubmissionPage` is a **post-test result viewer** (shows your latest test result + violation analysis). Next.js `submitted/page` is a **submissions history list**. They serve different purposes.

**Verdict:** ⚠️ Partially ported. The post-test result detail view is missing. The history list is new and useful, but advanced filtering is absent.

---

## 10. Proctoring System

**CRA:** `ProctorContext.js` (581 lines) + `ViolationModal.js` + `ViolationWarningPopup.js`  
**Next.js:** `ProctorContext.tsx` (528 lines) + `ViolationModal.tsx` (162 lines) + `ViolationWarningPopup.tsx` (151 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Camera/mic permission requests | ✅ | ✅ |
| Fullscreen management | ✅ | ✅ |
| Tab switch detection | ✅ | ✅ |
| Violation tracking (count, max, auto-submit) | ✅ | ✅ |
| TensorFlow.js + COCO-SSD face detection | ✅ | ✅ |
| AI model loading (lite_mobilenet_v2) | ✅ | ✅ (dynamic import) |
| Violation modal (critical/warning) | ✅ | ✅ |
| Warning popup with auto-dismiss | ✅ | ✅ |
| Violation counter + progress bar | ✅ | ✅ |
| Auto-submit on max violations | ✅ | ✅ |
| Test cleanup on completion | ✅ | ✅ |
| Device capabilities detection | ✅ | ❌ (simplified) |
| Adaptive quality settings | ✅ (`adaptiveQuality`) | ❌ (simplified) |
| Performance optimization (memory cleanup) | ✅ (`optimizeMemoryUsage`) | ❌ (simplified) |
| Audio context monitoring | ✅ | ✅ |

**Verdict:** ✅ Fully ported. Next.js simplifies some performance optimization utilities but core proctoring is complete.

---

## 11. Permissions Page

**CRA:** `PermissionPage.js` (304 lines)  
**Next.js:** `website/src/app/(platform)/permissions/page.tsx` (342 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Camera/mic permission step | ✅ | ✅ |
| Fullscreen permission step | ✅ | ✅ |
| Step-by-step wizard | ✅ | ✅ |
| Environment info detection | ✅ `getEnvironmentInfo()` | ✅ |
| Permission status monitoring | ✅ | ✅ |
| Redirect to correct test after completion | ✅ | ✅ (`?start=true`) |
| HTTPS warning | ✅ | — |
| Permission denied handling | ✅ | ✅ |
| Browser-specific instructions | ✅ `getPermissionInstructions()` | ✅ |

**Verdict:** ✅ Fully ported.

---

## 12. Navigation Components

### Navbar

**CRA:** `Navbar.js` (53 lines — minimal, brand + admin badge)  
**Next.js:** Two navbars:
1. Marketing Navbar `sections/Navbar.tsx` (183 lines) — full marketing nav with scroll effects
2. Platform navbars — **built into each page** (dashboard, admin pages have their own nav)

### ✅ Fully Ported (redesigned)

| Feature | CRA | Next.js |
|---------|-----|---------|
| Brand logo | ✅ | ✅ |
| Admin badge link | ✅ | ✅ (role-based) |
| Marketing nav links | ❌ | ✅ (Features, Pricing, About, Contact) |
| Scroll-aware styling | ❌ | ✅ |
| Mobile menu | ❌ | ✅ |

### Sidebar

**CRA:** `Sidebar.js` (334 lines — admin-only sidebar)  
**Next.js:** Sidebar built into `admin/page.tsx` + shadcn `sidebar.tsx` UI component (727 lines)

### ✅ Fully Ported

| Feature | CRA | Next.js |
|---------|-----|---------|
| Collapsible sidebar | ✅ | ✅ |
| Nav groups (Main, Academic, Operations, System) | ✅ | ✅ |
| Profile section | ✅ | ✅ |
| Active tab highlight | ✅ | ✅ |
| Notification badges | ✅ | ❌ (not yet) |
| Logout | ✅ | ✅ |

**Verdict:** ✅ Fully ported. Sidebar badges missing.

---

## 13. Home / Marketing Page

**CRA:** `Home.js` (95 lines — just a router/redirect)  
**Next.js:** `website/src/app/page.tsx` (full marketing landing page)

### ✅ Redesigned & Enhanced

CRA's `Home.js` is just a role-based redirect component. Next.js replaces it with a full marketing page:
- Hero section with CTA
- Stats section
- Features section
- Testimonials
- Pricing
- CTA + Footer
- Smooth scroll (Lenis)
- Cursor glow effect

**Verdict:** ✅ Fully ported. Next.js has a proper marketing landing page instead of a redirect stub.

---

## 14. Loading / Error Components

**CRA:** `Loading.js` (112 lines) + `RealTimeLoader.js` (120 lines) + `ErrorBoundary.js` (121 lines)  
**Next.js:** `website/src/app/loading.tsx` (94 lines) + `website/src/app/error.tsx` (133 lines) + platform layout loading state

### ✅ Fully Ported

| Component | CRA | Next.js |
|-----------|-----|---------|
| Global loading spinner | ✅ `Loading.js` | ✅ `loading.tsx` (Next.js file convention) |
| Error boundary | ✅ `ErrorBoundary.js` (class component) | ✅ `error.tsx` (Next.js file convention) |
| Real-time data loader | ✅ `RealTimeLoader.js` | ❌ Replaced by inline loading states |
| 404 page | ❌ | ✅ `not-found.tsx` (new) |
| Platform loading state | ❌ | ✅ (in `(platform)/layout.tsx`) |

**Verdict:** ✅ Fully ported via Next.js file conventions.

---

## 15. Dev/Test Components

### ❌ Completely Missing from Next.js

| Component | CRA | Next.js | Status |
|-----------|-----|---------|--------|
| `TestAccountManager.js` (219 lines) — Create/delete test accounts, check existing | ✅ | ❌ | ❌ Missing |
| `TestAccountIndicator.js` (46 lines) — Fixed banner for test accounts | ✅ | ❌ | ❌ Missing |
| `TestAccountInfo.js` (139 lines) — Floating 🧪 panel with test credentials | ✅ | ❌ | ❌ Missing |
| `CSVForwardingTest.js` (391 lines) — Test real-time CSV forwarding, multi-device | ✅ | ❌ | ❌ Missing |
| `TestLogin.js` (198 lines) — Quick-login panel for test accounts | ✅ | ❌ | ❌ Missing (auth page has inline test logic) |

**Note:** These are **dev-only** debugging/testing utilities. Not critical for production.

### Other Missing Components

| Component | CRA | Next.js | Status |
|-----------|-----|---------|--------|
| `PrivateRoute.js` — Route guard wrapper | ✅ | N/A | Replaced by `(platform)/layout.tsx` auth guard |
| `FaceDetection.js` — Standalone face detection | Empty file | N/A | Was never implemented |
| `FileUpload.js` — Drag & drop file upload | ✅ (118 lines) | ❌ | ❌ Missing |
| `Dashboard.js` — Generic dashboard (if exists) | ✅ | ✅ | Replaced by `StudentDashboard` |

---

## 16. Services Comparison

**CRA:** `src/services/` (16 files)  
**Next.js:** `website/src/lib/services/` (16 files — same names)

| Service | CRA | Next.js | Status |
|---------|-----|---------|--------|
| `adminCSVService.js` | ✅ | ✅ | ✅ Ported |
| `browserCService.js` | ✅ | ✅ | ✅ Ported |
| `browserPythonService.js` | ✅ | ✅ | ✅ Ported |
| `dsaService.js` | ✅ | ✅ | ✅ Ported |
| `jobService.js` | ✅ | ✅ | ✅ Ported |
| `leaderboardService.js` | ✅ | ✅ | ✅ Ported |
| `localStorageService.js` | ✅ | ✅ | ✅ Ported |
| `pyodidePythonService.js` | ✅ | ✅ | ✅ Ported |
| `realTimeService.js` | ✅ | ✅ | ✅ Ported |
| `sampleDataService.js` | ✅ | ✅ | ✅ Ported |
| `storageService.js` | ✅ | ✅ | ✅ Ported |
| `submissionForwardingService.js` | ✅ | ✅ | ✅ Ported |
| `submissionService.js` | ✅ | ✅ | ⚠️ Different — Next.js uses `apiClient` (MongoDB), CRA uses Supabase |
| `supabaseService.js` | ✅ (Supabase direct) | ✅ | ⚠️ Next.js wraps calls through `apiClient` backend |
| `supabaseStorageService.js` | ✅ | ✅ | ✅ Ported |
| `unifiedCodeService.js` | ✅ | ✅ | ✅ Ported |

**Key architecture change:** CRA talks directly to Supabase. Next.js routes through a backend API (`apiClient.js` → `localhost:5001/api/*`), which then talks to MongoDB Atlas.

**Verdict:** ⚠️ All 16 service files exist in both, but the underlying data layer changed from Supabase to MongoDB via API backend.

---

## 17. Utils Comparison

**CRA:** `src/utils/` (9 files)  
**Next.js:** `website/src/lib/utils/` (9 files — same names)

| Utility | CRA | Next.js | Status |
|---------|-----|---------|--------|
| `deviceOptimization.js` | ✅ | ✅ | ✅ Ported |
| `environmentCheck.js` | ✅ | ✅ | ✅ Ported |
| `leaderboardDemo.js` | ✅ | ✅ | ✅ Ported |
| `performanceOptimization.js` | ✅ | ✅ | ✅ Ported |
| `roleManager.js` | ✅ | ✅ | ✅ Ported |
| `testAccountUtils.js` | ✅ | ✅ | ✅ Ported |
| `testSubmissionFlow.js` | ✅ | ✅ | ✅ Ported |
| `userActivity.js` | ✅ | ✅ | ✅ Ported |
| `violationAnalysis.js` | ✅ | ✅ | ✅ Ported |

**Verdict:** ⚠️ All 9 utility files exist in both. Some may need internal updates to work with the new backend.

---

## 18. Hooks Comparison

**CRA:** `src/hooks/useRealTime.js`  
**Next.js:** `website/src/lib/hooks/useRealTime.ts` + `useAuth.tsx`

| Hook | CRA | Next.js | Status |
|------|-----|---------|--------|
| `useRealTime` | ✅ | ✅ | ✅ Ported (TypeScript) |
| `useAuth` | N/A (context-based) | ✅ | ✅ New — replaces `useSimpleAuth` |

**Verdict:** ✅ Fully ported + improved with TypeScript types.

---

## 19. Context Comparison

**CRA:** `src/context/SimpleAuthContext.js` (459 lines) + `ProctorContext.js` (581 lines)  
**Next.js:** `website/src/lib/context/ProctorContext.tsx` (528 lines) + `website/src/lib/hooks/useAuth.tsx` (309 lines)

| Context | CRA | Next.js | Status |
|---------|-----|---------|--------|
| `ProctorContext` | ✅ | ✅ `ProctorContext.tsx` | ✅ Ported (TypeScript) |
| `SimpleAuthContext` | ✅ (Supabase-based, 459 lines) | → `useAuth.tsx` (JWT/API-based, 309 lines) | ⚠️ Rewritten |

**Missing from new auth:**
- `updateLastActive()` — user activity tracking (CRA had this, critical for "active users" feature)
- `getAllUsers()` — was a direct method (Next.js uses `supabaseService.getAllUsers()` instead)
- `promoteToAdmin()` — test helper
- Online/offline detection with `syncPendingSubmissions()`
- Direct Supabase auth listener (`onAuthStateChange`)

**Verdict:** ⚠️ Partially ported. Auth context was rewritten for JWT. Some helper methods not carried over.

---

## 20. Config Comparison

**CRA:** `src/config/supabaseConfig.js` + `testAccounts.js`  
**Next.js:** `website/src/lib/config/testAccounts.js` + `website/src/lib/supabase.ts` (deprecated stub) + `website/src/lib/constants.js`

| Config | CRA | Next.js | Status |
|--------|-----|---------|--------|
| `testAccounts.js` | ✅ | ✅ | ✅ Ported |
| `supabaseConfig.js` | ✅ (active Supabase client) | `supabase.ts` (deprecated stub, `supabase = null`) | ⚠️ Replaced by `apiClient.js` |
| `constants.js` (USER_ROLES, ROLE_PERMISSIONS, API_URL) | ❌ | ✅ | ✅ New |

**Verdict:** ⚠️ Partially ported. Supabase config replaced by API client + constants.

---

## 21. Activity Tracker

**CRA:** `ActivityTracker.js` (50 lines — invisible component, updates user activity every 30s + on mouse/key/scroll)  
**Next.js:** **No equivalent component**

### ❌ Missing

The CRA `ActivityTracker` is a headless component that:
1. Calls `updateLastActive(userId)` every 30 seconds
2. Listens for `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click` events
3. Updates the user's "last active" timestamp in the database

This feeds the **Active Users** monitoring in the admin dashboard. Without it, the admin's "active users" tab may not have accurate real-time activity data.

**Verdict:** ❌ Missing from Next.js. Needed for accurate active-user monitoring.

---

## Critical Gaps Summary

### Must-Fix (Functional Impact)

1. **❌ Super Admin Dashboard** — No `/super-admin` page exists. Login redirects to a non-existent route.
2. **❌ Activity Tracker** — No component sends activity heartbeats. Admin "Active Users" tab will show stale data.
3. **⚠️ ProblemSolver page** — No dedicated problem-solving page with Monaco Editor. Problems list just links to DSA test.
4. **⚠️ Post-test result detail view** — CRA's `SubmissionPage.js` shows violation analysis, time breakdown, performance summary after a test. Next.js lacks this.

### Nice-to-Have (Dev/QA Impact)

5. **❌ TestAccountManager / TestAccountIndicator / TestAccountInfo** — Dev testing utilities absent.
6. **❌ CSVForwardingTest** — QA test component for submission forwarding.
7. **❌ FileUpload component** — Drag & drop file upload not ported.
8. **⚠️ Advanced submission filters** — CRA had date range, score range, device type, violation flag filters.

### Architecture Differences (Not Bugs, Just Different)

- **Auth:** Supabase direct → JWT + MongoDB backend API
- **Data fetching:** Direct Supabase queries → `apiClient` → Express backend → MongoDB
- **Styling:** CSS files → Tailwind CSS + Framer Motion
- **Routing:** React Router → Next.js App Router with route groups
- **State management:** Context API (both), but Next.js uses dedicated hooks
- **TypeScript:** CRA is all JS → Next.js is TypeScript
