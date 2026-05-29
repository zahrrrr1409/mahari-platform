# Mahari v0.1 — Test Scenarios

> Run these before deploying to production and after every significant change.
> Each scenario includes: precondition → steps → expected result → what it verifies.

---

## Setup: Test Accounts

Before running any test, create these accounts in order:

```
Admin:      admin@test.sa        / TestPass123!   / role: admin
Supervisor: supervisor@test.sa   / TestPass123!   / role: supervisor / school: Al-Noor School
Supervisor2: sup2@test.sa        / TestPass123!   / role: supervisor / school: Al-Fajr School (different)
Teacher:    teacher@test.sa      / TestPass123!   / role: teacher    / school: Al-Noor School
Principal:  principal@test.sa    / TestPass123!   / role: principal  / school: Al-Noor School
Parent:     parent@test.sa       / TestPass123!   / role: parent     (created via invite)
```

Create via `POST /api/admin/users` (logged in as admin) for all except parent (use invite flow).

---

## 1. Authentication Flows

### 1.1 Successful login — Supervisor
**Precondition:** Supervisor account exists
**Steps:**
1. Open `/login`
2. Enter `supervisor@test.sa` / `TestPass123!`
3. Click "تسجيل الدخول"

**Expected:** Redirect to `/dashboard`. Sidebar shows supervisor name + logout button.
**Verifies:** Supabase auth, JWT, app_metadata RBAC, middleware redirect

---

### 1.2 Successful login — Parent
**Steps:** Same with parent account after activation

**Expected:** Redirect to `/parent`. Shows "بوابة ولي الأمر" header.
**Verifies:** Role-based routing for parent role

---

### 1.3 Successful login — Principal
**Steps:** Same with principal account

**Expected:** Redirect to `/school`. Shows school analytics.

---

### 1.4 Wrong password
**Steps:** Enter correct email, wrong password

**Expected:** Error message "البريد الإلكتروني أو كلمة المرور غير صحيحة". No redirect.
**Verifies:** Auth error handling, no information leakage (same message for wrong user or wrong password)

---

### 1.5 Logout
**Precondition:** Logged in as supervisor
**Steps:** Click "تسجيل الخروج" in sidebar

**Expected:** Redirect to `/login`. Navigating back to `/dashboard` redirects to `/login` again.
**Verifies:** Session cleared, middleware protection working

---

### 1.6 Direct URL access without auth
**Steps:** Without logging in, navigate to `http://localhost:3000/dashboard`

**Expected:** Redirect to `/login?redirectTo=/dashboard`
**Verifies:** Middleware route protection

---

### 1.7 Wrong-role URL access
**Steps:** Log in as parent, navigate to `/dashboard`

**Expected:** Redirect to `/parent` (parent's home)
**Verifies:** Layout-level role guard

---

## 2. Supervisor — Student Management

### 2.1 Create a student
**Precondition:** Logged in as supervisor
**Steps:**
1. Click "الطلاب" in sidebar
2. Click "+ طالب جديد"
3. Enter: nameAr=`فهد الشمري`, nameEn=`Fahad`, grade=`Grade 10`, program=`التعليم الدامج`
4. Click "إنشاء الملف"

**Expected:** Redirect to new student's profile page. Profile strength shows 0%. Ability signature area shows empty state message.
**Verifies:** Student INSERT, auto_create_skill_profile trigger, supervisor_assignments auto-assignment

---

### 2.2 Attempt to create student with diagnosis field
**Steps:** Via API directly:
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer SUPERVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nameAr":"فهد","diagnosis":"ADHD","schoolId":"SCHOOL_UUID"}'
```

**Expected:** HTTP 422 with `FORBIDDEN_FIELD` error code.
**Verifies:** Diagnosis field rejection — core platform guarantee

---

### 2.3 Profile strength formula
**Precondition:** Student exists with 0 assessments
**Steps:** Record assessments in this exact order:
1. Daily Life Skills → Level 3
2. Communication → Level 2
3. Digital Skills → Level 4
4. Social Skills → Level 2
5. Vocational Skills → Level 4
6. Self-Advocacy → Level 3

**Expected:** After each assessment, profile strength updates. After all 6:
- Sum = 3+2+4+2+4+3 = 18
- Strength = (18/24) × 100 = **75%**

**Verifies:** recalc_profile_strength trigger, formula correctness

---

### 2.4 Assessment stepper — full flow
**Precondition:** Student exists, logged in as supervisor
**Steps:**
1. Go to student profile → click "+ تقييم جديد"
2. Step 1: Select "Digital Skills"
3. Step 2: Select "Independent" (level 4)
4. Step 3: Enter 30+ character observation note
5. Step 4: Click "إنشاء تحليل ذكاء اصطناعي"
6. Wait for AI response (may take 10–20s)
7. Verify AI insight appears
8. Click "حفظ التقييم"

**Expected:** Redirect to student profile. New domain level shows in radar and domain card. AI insight appears in `/dashboard/review` as pending.
**Verifies:** Full assessment + AI pipeline

---

### 2.5 Assessment observation minimum length
**Steps:** In Step 3, type fewer than 30 characters

**Expected:** "متابعة ←" button is disabled (gray, not clickable). Character counter shows e.g. "22/30 حرف كحد أدنى".
**Verifies:** Input validation in form

---

### 2.6 Add observation
**Steps:** Student profile → "الملاحظات" → add 20+ character observation

**Expected:** Observation appears in list with "الفصل الدراسي" badge. No "تنتظر التحقق" badge (supervisor observations are auto-verified).
**Verifies:** Observation INSERT, observer_role, is_verified logic

---

### 2.7 Create skill plan
**Steps:** Student profile → "خطط المهارات" → "+ خطة جديدة" → select domain → enter 20+ char description → save

**Expected:** Plan appears in list with "نشطة" status badge and the domain's border color.
**Verifies:** skill_plans INSERT

---

### 2.8 Mark plan as completed
**Steps:** Click "✓ مكتملة" on an active plan

**Expected:** Badge changes from "نشطة" (green) to "مكتملة" (blue). "✓ مكتملة" button disappears.
**Verifies:** skill_plans UPDATE

---

## 3. Supervisor — AI Review Queue

### 3.1 Pending recommendation appears
**Precondition:** Assessment was recorded (§2.4 step 8)
**Steps:** Navigate to `/dashboard/review`

**Expected:** Card appears for the student with:
- Student name
- Domain name + "رؤية حول القدرات"
- Confidence percentage
- AI draft text with teal left border

**Verifies:** ai_recommendations query, RLS for school_id, review_status=pending

---

### 3.2 Approve recommendation
**Steps:** Click "موافقة" → click "تأكيد الموافقة"

**Expected:** Card disappears from queue. On the student's profile, ability signature or domain insight appears. Pending AI count in sidebar decreases.
**Verifies:** review_status=approved, content_approved set, badge count update

---

### 3.3 Modify and approve
**Steps:** Click "تعديل وموافقة" → edit the text → click "حفظ التعديل والموافقة"

**Expected:** Card disappears. review_status=modified. content_approved = edited text (not original draft).
**Verifies:** Human-in-the-loop modification flow

---

### 3.4 Reject recommendation
**Steps:** Click "رفض" → enter 10+ character reason → click "تأكيد الرفض"

**Expected:** Card disappears. review_status=rejected. Rejected record not visible to parent.
**Verifies:** Rejection flow, reviewer_notes saved

---

### 3.5 Parent cannot see pending recommendation
**Precondition:** Recommendation exists with status=pending
**Steps:** Log in as parent → navigate to child profile

**Expected:** No AI insight visible on the child's profile.
**Verifies:** RLS: parent only sees approved/modified records

---

## 4. Supervisor — Ability Signature

### 4.1 Generate ability signature
**Precondition:** Student has at least 1 assessment
**Steps:** On student profile, click "إنشاء بصمة القدرة بالذكاء الاصطناعي"

**Expected:** Button changes to "جارٍ الإنشاء…". After 10–20s, button changes to "✓ تم إنشاء مسودة البصمة — راجعها في قائمة مراجعة الذكاء الاصطناعي".
**Verifies:** AI signature API, Claude API call, ai_recommendations INSERT

---

### 4.2 Approve signature → visible on profile
**Steps:**
1. Go to `/dashboard/review`
2. Approve the capability_insight recommendation

**Expected:** On student profile, the amber "مسودة البصمة — تنتظر موافقتك" card changes to the approved teal "بصمة القدرة" card.
**Verifies:** ability_signature vs sig_draft logic, UI update after approval

---

### 4.3 Parent sees approved signature only
**Steps:** Log in as parent, view child profile

**Expected:** Approved signature text visible. No "sig_draft" text visible. No "pending" status label.
**Verifies:** AbilitySignature component conditional rendering for parent role

---

## 5. Parent Portal

### 5.1 Parent invite flow
**Precondition:** Supervisor logged in, student exists in caseload
**Steps:**
1. Use `POST /api/admin/invite` with `parentEmail` and `studentId`
2. Check email inbox for invite
3. Click magic link
4. Page shows "جارٍ التفعيل…" then redirects to `/parent`

**Expected:** Parent is logged in. Their child appears in the children list.
**Verifies:** Supabase invite email, onAuthStateChange flow, parent_student_links, parent RLS

---

### 5.2 Parent submit home observation
**Precondition:** Parent logged in, child visible
**Steps:** Navigate to child profile → scroll to "ملاحظة من المنزل" → type 20+ chars → click "إرسال الملاحظة"

**Expected:** Success message appears. In supervisor's observation log, the observation shows with "تنتظر التحقق" badge.
**Verifies:** parent INSERT policy, is_verified=false enforcement

---

### 5.3 Parent cannot access another student
**Steps:** Log in as parent, navigate to `/parent/children/STUDENT_BELONGING_TO_OTHER_PARENT`

**Expected:** 404 page. NOT the student's data.
**Verifies:** Parent RLS: parent_student_links check

---

## 6. Principal Dashboard

### 6.1 School analytics loads
**Precondition:** Principal logged in, school has students + assessments
**Steps:** Navigate to `/school`

**Expected:**
- 4 stat cards: student count, avg capability strength, total assessments, pending AI count
- Domain averages grid with progress bars
- "بيانات مجمّعة — لا يُعرض أي محتوى فردي" subtitle visible

**Verifies:** Principal RLS (school-scoped aggregate data only)

---

### 6.2 Principal cannot see student names
**Steps:** Inspect page source / network responses on `/school`

**Expected:** No individual student names, ability signatures, or personal details in any response.
**Verifies:** School page only shows aggregated statistics

---

## 7. Cross-School Security (Critical)

### 7.1 Supervisor cannot see other school's students
**Precondition:** Two schools exist. Supervisor A in School 1, Supervisor B in School 2.
**Steps:** Log in as Supervisor A. Navigate to `/dashboard/students/[ID_OF_SCHOOL_2_STUDENT]`

**Expected:** 404 — not found.
**Verifies:** students RLS (supervisor_assignments check)

---

### 7.2 API cross-school isolation
**Steps:**
```bash
# Get a student ID from school 2
# Log in as supervisor from school 1, get their access token
curl http://localhost:3000/api/students/SCHOOL_2_STUDENT_ID \
  -H "Authorization: Bearer SCHOOL_1_SUPERVISOR_TOKEN"
```

**Expected:** `{"error": "NOT_FOUND"}` or 404 — NOT the student data.
**Verifies:** RLS at the API route level

---

### 7.3 Admin bypass: only admin can create other admins
**Steps:** Log in as supervisor, attempt:
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer SUPERVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"evil@test.com","nameAr":"test","role":"admin"}'
```

**Expected:** `{"error": "FORBIDDEN"}` — supervisor cannot create admin accounts.
**Verifies:** Admin route role check

---

## 8. Edge Cases

### 8.1 Assessment stepper — save without AI
**Steps:** Complete steps 1–3, click "حفظ التقييم" WITHOUT generating AI insight

**Expected:** Assessment saves. Redirect to student profile. Profile strength updates. No pending AI recommendation created (since AI was not called).

---

### 8.2 Network offline during AI generation
**Steps:** Start "Generate AI Insight" → disconnect network → wait for error

**Expected:** Error message appears: "تعذّر إنشاء التحليل الآن. سيُنشأ تلقائياً بعد الحفظ." Assessment form remains usable.
**Verifies:** AI error handling, assessment is not blocked by AI failure

---

### 8.3 Duplicate domain assessment
**Steps:** Record two assessments for the same domain (e.g., Digital Skills at level 3, then Digital Skills at level 4)

**Expected:** Profile strength uses the LATEST assessment for each domain. After second assessment at level 4, the radar and domain card show level 4.
**Verifies:** DISTINCT ON latest per domain in recalc_profile_strength trigger

---

### 8.4 Expired invite link
**Precondition:** Invite was sent more than 24 hours ago (Supabase default expiry)
**Steps:** Click the invite link

**Expected:** Page shows error message: "انتهت صلاحية رابط الدعوة. يرجى طلب رابط جديد من المشرف." NOT a 500 error.
**Verifies:** Invite page error handling

---

### 8.5 Loading states
**Steps:** On a slow connection (DevTools → Network → Throttle to "Slow 3G"), navigate between dashboard pages

**Expected:** Shimmer skeleton loading states appear within 100ms. No blank screens.
**Verifies:** loading.tsx skeleton components

---

### 8.6 Error recovery
**Steps:** Simulate an error (e.g., temporarily set a wrong Supabase URL in env)

**Expected:** Error boundary catches the error. Shows "حدث خطأ غير متوقع" with "إعادة المحاولة" and "لوحة المتابعة" buttons. In development, shows error details. In production, shows generic message only.
**Verifies:** error.tsx boundaries

---

## 9. RTL Rendering

### 9.1 Right-to-left layout
**Steps:** Open any page in a browser

**Expected:**
- Content flows right-to-left
- Sidebar is on the RIGHT side of the screen
- Text aligns to the right
- "Back" buttons have `→` arrow (pointing right = backward in RTL)
- "Continue" buttons have `←` arrow (pointing left = forward in RTL)

---

### 9.2 Email/password inputs are LTR
**Steps:** Open login page, inspect the email and password inputs

**Expected:** Email and password fields have `dir="ltr"` — they render left-to-right as expected for technical fields.

---

### 9.3 Icons render correctly
**Steps:** Check sidebar, assessment stepper, recommendation cards

**Expected:** Tabler icons render as visible icons (not blank squares or boxes).
**Verifies:** Tabler Icons CDN loaded from layout.tsx

---

## 10. Production Smoke Tests

Run after every Vercel deployment:

```
1. https://your-app.vercel.app               → redirects to /login    ✓
2. /login with valid credentials              → redirects to /dashboard ✓
3. /dashboard loads with no console errors   →                         ✓
4. POST /api/admin/users without auth        → returns 401             ✓
5. POST /api/ai/signature without auth       → returns 401             ✓
6. No SERVICE_ROLE_KEY in Network responses  →                         ✓
7. /dashboard/students/NONEXISTENT_UUID      → shows 404 page          ✓
```

---

## Test Data Cleanup

After testing, clean up via Supabase Dashboard → Table Editor:
1. Delete test students (cascades to assessments, profiles, recommendations)
2. Delete test users via Authentication → Users
3. Delete test school (if created for testing only)

> For a clean slate: `supabase db reset` (local only — destroys all data)
