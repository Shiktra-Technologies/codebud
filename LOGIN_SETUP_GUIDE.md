# Login Setup Guide - Email Confirmation Issue

## Problem
Login is not working because Supabase requires email confirmation by default. When users sign up, they receive a confirmation email and cannot log in until they click the link.

## Solution Options

### Option 1: Disable Email Confirmation (Recommended for Development)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `codebud_frontend`
3. **Go to Authentication** → **Settings** (or **Providers**)
4. **Find "Email Auth"** section
5. **Disable "Confirm email"** option
6. **Save changes**

After this, users can sign in immediately after signup without email confirmation.

### Option 2: Use Email Confirmation (Recommended for Production)

Keep email confirmation enabled and inform users:

1. Users sign up → receive email
2. Users click confirmation link in email
3. Users can then log in

The app now shows proper messages:
- ✅ After signup: "Account created! Please check your email to confirm..."
- ⚠️ At login (if not confirmed): "Please confirm your email address before signing in..."

## Test Accounts

You can create test accounts directly in Supabase to bypass email confirmation:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add User**
3. Enter email and password
4. Set **Email Confirmed** to `true`
5. Click **Create User**

## Quick Test Credentials

For immediate testing, create these accounts in Supabase:

**Student Account:**
- Email: `student@test.com`
- Password: `password123`
- Role: Add to `users` table with `role = 'student'`

**Admin Account:**
- Email: `admin@test.com`
- Password: `password123`
- Role: Add to `users` table with `role = 'admin'`

**Super Admin:**
- No email needed
- Secret Code: `admin@2024`
- Press `Ctrl + Shift + S` on login page to reveal super admin option

## How to Create User in Supabase

1. **Create Auth User:**
   - Go to Authentication → Users
   - Add user with email/password
   - Mark email as confirmed

2. **Add to Users Table:**
   ```sql
   INSERT INTO users (id, email, display_name, role, is_active)
   VALUES (
     'USER_ID_FROM_AUTH',  -- Copy from auth.users
     'test@example.com',
     'Test User',
     'student',  -- or 'admin'
     true
   );
   ```

## Verification

After setup, try logging in:

1. Open http://localhost:3000
2. Click role (Student/Admin)
3. Enter credentials
4. Should redirect to appropriate dashboard

## Common Errors and Solutions

| Error Message | Solution |
|--------------|----------|
| "Invalid login credentials" | Check email/password are correct |
| "Please confirm your email" | Either disable email confirmation OR click link in email |
| "No account found" | Create user in both auth.users AND users table |
| "Access denied. This account is registered as..." | You're trying to log in with wrong role selector |

## Current App Features

✅ Improved error messages
✅ Email confirmation detection
✅ Success messages after signup
✅ Role-based login (Student/Admin/Super Admin)
✅ Better UX feedback

## Need Help?

If login still doesn't work:

1. Check browser console for detailed errors (F12)
2. Verify Supabase connection (green status in dashboard)
3. Check if user exists in BOTH:
   - `auth.users` table
   - `public.users` table
4. Verify roles match between login selector and database
