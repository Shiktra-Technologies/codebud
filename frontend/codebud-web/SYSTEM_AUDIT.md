# CodeBud — Full System Connectivity & Role Isolation Audit

**Date:** June 2025  
**Scope:** Backend (Flask), Database (MongoDB/Mock), Frontend (Next.js 15), Auth (JWT), All 4 roles

---

## 1. Database Relationships & ID Handling

### The ID Chain (Verified Working)

```
MongoDB ObjectId → str() in JWT → str in frontend → str in POST body → str stored in collections → str queried
```

| Step | Format | Location |
|------|--------|----------|
| User created | `ObjectId('67abc...')` | `users._id` |
| Token generated | `str(user['_id'])` = `'67abc...'` | JWT `user_id` field |
| Frontend receives | `'67abc...'` | `user._id` via `serialize_doc` |
| Admin assigns student | POST `{mentor_id: '67abc...', student_id: '67def...'}` | MentorTab.tsx |
| Stored in DB | `{mentor_id: '67abc...', student_id: '67def...'}` | `mentor_students` collection |
| Mentor queries | `find({mentor_id: g.current_user_id})` where `g.current_user_id = '67abc...'` | app.py |

**Verdict:** String-to-string matching throughout — **consistent and correct**.

### Collections & Their Relationships

```
users (_id)
  ├── submissions.user_id → users._id (str)
  ├── code_submissions.user_id → users._id (str)
  ├── mentor_students.mentor_id → users._id (str)
  ├── mentor_students.student_id → users._id (str)
  ├── mentor_feedback.mentor_id → users._id (str)
  ├── mentor_feedback.student_id → users._id (str)
  ├── practice_sets.mentor_id → users._id (str)
  └── practice_submissions.student_id → users._id (str)
```

### `get_user()` Resolves Both Formats
```python
def get_user(self, user_id):
    if isinstance(user_id, str):
        try:
            oid = ObjectId(user_id)  # Try ObjectId first
            result = self.users.find_one({'_id': oid})
            if result: return result
        except: pass
    return self.users.find_one({'_id': user_id})  # Fall back to string
```

---

## 2. Role Filtering & Access Control

### Auth Decorators (server/app.py)

| Decorator | Who it allows | Sets |
|-----------|--------------|------|
| `@require_auth` | Any valid JWT | `g.current_user_id`, `g.current_user_role` |
| `@require_admin` | `admin`, `super_admin` | Same + blocks others with 403 |
| `@require_mentor` | `mentor`, `admin`, `super_admin` | Same + blocks others with 403 |

### Endpoint Access Matrix

| Route | Method | Guard | Roles |
|-------|--------|-------|-------|
| `/api/auth/signup` | POST | None (but blocks privileged roles without admin JWT) | Public |
| `/api/auth/login` | POST | None | Public |
| `/api/auth/me` | GET | `@require_auth` | All |
| `/api/users` | GET | `@require_admin` | admin, super_admin |
| `/api/users/<id>` | GET | `@require_auth` | All |
| `/api/users/<id>` | PATCH | `@require_admin` | admin, super_admin |
| `/api/submissions` | POST | `@require_auth` | All |
| `/api/submissions` | GET | `@require_admin` | admin, super_admin |
| `/api/submissions/<uid>` | GET | `@require_auth` + IDOR check | owner, mentor (assigned), admin |
| `/api/code-submissions/<uid>` | GET | `@require_auth` + IDOR check | owner, mentor (assigned), admin |
| `/api/mentor/students` | GET | `@require_mentor` | mentor (own), admin (any via ?mentor_id) |
| `/api/mentor/students` | POST | `@require_admin` | admin, super_admin |
| `/api/mentor/students/<sid>` | DELETE | `@require_admin` | admin, super_admin |
| `/api/mentor/students/<sid>/analytics` | GET | `@require_mentor` + IDOR | mentor (assigned), admin |
| `/api/mentor/feedback` | POST | `@require_mentor` + IDOR | mentor (assigned), admin |
| `/api/mentor/feedback/<sid>` | GET | `@require_mentor` + IDOR | mentor (assigned), admin |
| `/api/mentor/feedback/<fid>` | PATCH | `@require_mentor` + author check | author, admin |
| `/api/mentor/feedback/<fid>` | DELETE | `@require_mentor` + author check | author, admin |
| `/api/mentor/practice-sets` | POST/GET | `@require_mentor` | mentor, admin |
| `/api/mentor/practice-sets/<id>` | PATCH | `@require_mentor` + creator check | creator, admin |
| `/api/mentor/dashboard-stats` | GET | `@require_mentor` | mentor, admin |
| `/api/problems` | GET | None | Public |
| `/api/run` | POST | `@require_auth` | All |

### IDOR (Insecure Direct Object Reference) Prevention
- Mentor feedback routes verify the student is **assigned** to the requesting mentor
- Submission routes verify either **own data**, **assigned mentor**, or **admin**
- Practice set updates verify **creator** or **admin**

---

## 3. Frontend Route Guards (Middleware)

**File:** `website/src/middleware.ts`

| Route Pattern | JWT Required | Allowed Roles |
|---------------|-------------|---------------|
| `/admin/*` | Yes | admin, super_admin |
| `/mentor/*` | Yes | mentor, admin, super_admin |
| `/super-admin/*` | Yes | super_admin only |
| `/dashboard/*` | Yes | Any authenticated |
| `/profile/*` | Yes | Any authenticated |
| `/aptitude-test` | Yes | Any authenticated |
| `/dsa-test` | Yes | Any authenticated |
| `/problems/*` | Yes | Any authenticated |
| `/submitted` | Yes | Any authenticated |
| `/auth/*` | No | Public |
| `/*` (other) | No | Public |

**Notes:**
- Middleware decodes JWT but does NOT verify signature (edge runtime limitation)
- Signature verification happens server-side in Flask when API calls are made
- Admin page.tsx has secondary `useEffect` check: redirects non-admin/super_admin to `/dashboard`

---

## 4. Dashboard Data Flow

### Admin Dashboard (`/admin`)
```
useRealTime(3s poll)
  ├── getAllUsers() → GET /api/users → all users (admin only)
  ├── getAllSubmissions() → GET /api/submissions → all submissions (admin only)
  └── Filter: activeStudents = users where last_active > 5 min ago
      └── ActiveUsersTab receives filtered list
```

### Mentor Dashboard (`/mentor`)
```
On mount:
  ├── getMentorDashboardStats() → GET /api/mentor/dashboard-stats
  └── getMentorStudents() → GET /api/mentor/students → assigned students only
```

### Student Dashboard (`/dashboard`)
```
On mount:
  ├── getUserSubmissions(user._id) → GET /api/submissions/<userId>
  ├── leaderboardService.getLeaderboard()
  └── jobService.getJobs()
```

---

## 5. Connectivity Map

```
┌──────────────┐     JWT Bearer      ┌──────────────┐     PyMongo     ┌────────────┐
│   Next.js    │ ──────────────────→  │   Flask API  │ ─────────────→  │  MongoDB   │
│   Frontend   │ ←───── JSON ──────── │  (port 5001) │ ←──────────────  │  Atlas     │
│   (port 3000)│                      │              │                  │            │
└──────────────┘                      │  MockDB ←──┐ │                  └────────────┘
       │                              │  fallback  │ │
       │ Cookie: codebud_token        └────────────┘ │
       │                                    ↓        │
       ├── apiClient.js ──── Axios ──→ baseURL       │
       │   (auto JWT header)              │          │
       │                                  └──────────┘
       │
       └── middleware.ts ── Edge runtime
           (JWT decode, no verify)
```

### Service → Endpoint Mapping

| Frontend Service | File | Endpoints Used |
|-----------------|------|----------------|
| apiClient | `lib/apiClient.js` | All (base layer) |
| supabaseService | `lib/services/supabaseService.js` | `/api/users`, `/api/users/<id>`, `/api/users/<id>/activity` |
| submissionService | `lib/services/submissionService.js` | `/api/submissions` (POST, GET, GET/<uid>) |
| mentorService | `lib/services/mentorService.ts` | All `/api/mentor/*` endpoints |
| useAuth | `lib/hooks/useAuth.tsx` | `/api/auth/signup`, `/api/auth/login`, `/api/auth/me` |
| useRealTime | `lib/hooks/useRealTime.ts` | Uses supabaseService + submissionService |

---

## 6. Bugs Found & Fixed

### CRITICAL: MockCollection Missing Methods (Fixed)
**File:** `server/services/mongodb_service.py`  
**Impact:** Server crash on ANY mentor/feedback/practice route when MongoDB is unavailable  
**Root Cause:** `MockCollection` was missing `count_documents()`, `delete_one()`, and `update_one()` returned no result object (no `modified_count`)  
**Fix:** Added all three methods with proper return objects matching pymongo API

### CRITICAL: `db_service.db['collection']` → Null Crash in Mock Mode (Fixed)
**File:** `server/app.py` (27 occurrences)  
**Impact:** Every mentor route crashed with `TypeError: 'NoneType' object is not subscriptable` when `db_service.db` was `None` (mock mode)  
**Root Cause:** Routes used `db_service.db['mentor_students']` (raw pymongo access) instead of `db_service.mentor_students` (property that falls back to MockCollection)  
**Fix:** Replaced all 27 occurrences with property accessor pattern

### HIGH: `_id` vs `id` Mismatch in Admin Real-Time Dashboard (Fixed)
**Files:** `useRealTime.ts`, `ActiveUsersTab.tsx`  
**Impact:** Active users tab showed users but couldn't correlate submissions, expandable rows broken, submission counts always 0  
**Root Cause:** TypeScript interfaces defined `id: string` but MongoDB API returns `_id: string`. All lookups like `student.id` returned `undefined`  
**Fix:** Changed interfaces to use `_id` as primary key, updated all 7 reference sites in ActiveUsersTab

---

## 7. Remaining Considerations

### Why Mentor Dashboard Shows "0 Students"
This is **not a bug** — it's the expected state before an admin assigns students. The flow is:
1. Admin logs in → navigates to **Mentors** tab
2. Creates a mentor account (or uses existing `test_mentor@codebud.dev`)
3. Clicks **Assign** on a mentor card → searches for students → assigns them
4. Mentor logs in → now sees assigned students

### Active Users Tab Shows "No Active Users"
Expected when no users have `last_active` within 5 minutes. The **Students** tab (separate from Active Users) shows ALL students regardless of activity.

### Submission `user_id` in Socket Handler
The WebSocket `analyze_code` handler uses `data.get('user_id', 'test_user')` — this comes from the frontend, not from JWT auth. Ensure the frontend sends the correct user._id when emitting socket events.

### `serialize_doc` vs `serialize_user`
- `serialize_doc()`: Generic — converts ObjectId/datetime, strips password_hash, keeps all keys as-is including `_id`
- `serialize_user()`: Explicit — maps specific fields, always outputs `_id` as string

Both consistently output `_id`, never `id`.

---

## 8. Role Isolation Verification

| Action | student | mentor | admin | super_admin |
|--------|---------|--------|-------|-------------|
| View own dashboard | ✅ | ✅ | ✅ | ✅ |
| Submit tests | ✅ | ❌ | ✅ | ✅ |
| View own submissions | ✅ | ✅ | ✅ | ✅ |
| View other's submissions | ❌ | ✅ (assigned only) | ✅ (all) | ✅ (all) |
| View all users | ❌ | ❌ | ✅ | ✅ |
| Create mentor accounts | ❌ | ❌ | ✅ | ✅ |
| Assign students to mentors | ❌ | ❌ | ✅ | ✅ |
| Add feedback | ❌ | ✅ (assigned only) | ✅ | ✅ |
| Manage practice sets | ❌ | ✅ (own) | ✅ | ✅ |
| Deactivate users | ❌ | ❌ | ✅ | ✅ |
| Deactivate super_admin | ❌ | ❌ | ❌ | ✅ |
| Access /admin routes | ❌ | ❌ | ✅ | ✅ |
| Access /mentor routes | ❌ | ✅ | ✅ | ✅ |
| Access /super-admin routes | ❌ | ❌ | ❌ | ✅ |

---

## 9. Quick Debugging Checklist

1. **Server won't start?** → `cd server && source venv/bin/activate && python app.py`
2. **Students not visible in mentor dash?** → Admin must assign them first (Admin → Mentors tab → Assign)
3. **"No active users" in admin?** → Users must have `last_active` < 5 mins. Check **Students** tab instead
4. **401 errors?** → Token expired (72h). Clear localStorage + cookie, re-login
5. **Mock DB losing data?** → In-memory only; restarts clear everything. Use real MongoDB
6. **CORS issues?** → Flask has `CORS(app)` with `*` origin; check NEXT_PUBLIC_API_URL
7. **"Access denied" for mentor?** → Verify student assignment exists: `mentor_students.find({mentor_id, student_id, status: 'active'})`

---

## 10. Stability & Hardening Recommendations

| Priority | Item | Status |
|----------|------|--------|
| P0 | Mock DB compatibility (all CRUD methods) | ✅ Fixed |
| P0 | Property accessor pattern for collections | ✅ Fixed |
| P0 | Frontend `_id` consistency | ✅ Fixed |
| P1 | Add integration tests for mentor assignment flow | Recommended |
| P1 | Add API error boundaries in mentor dashboard | Recommended |
| P2 | Replace N+1 queries in dashboard-stats with aggregation | Recommended |
| P2 | Add WebSocket auth (currently no JWT validation on socket events) | Recommended |
| P3 | Add rate limiting on auth endpoints | Recommended |
| P3 | Add pagination to `/api/users` and `/api/submissions` | Recommended |
