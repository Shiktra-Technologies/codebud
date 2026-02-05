# Testing Accounts Setup

This document provides information about the pre-configured test accounts for easy development and testing of the CodeBud platform.

## 🚀 Quick Start

### Option 1: Quick Test Login (Recommended)
1. Go to the login page
2. Click the "🧪 Quick Test Login" button
3. Choose any test account and click "Login"
4. You'll be automatically logged in and redirected to the appropriate dashboard

### Option 2: Manual Login
Use the credentials below with the standard login form.

## 📋 Test Account Credentials

### 👤 Student Accounts

| Name | Email | Password | Roll Number | Class | Section |
|------|-------|----------|-------------|-------|---------|
| John Smith | `student1@test.com` | `test123` | STU001 | 12A | Computer Science |
| Jane Doe | `student2@test.com` | `test123` | STU002 | 12B | Information Technology |
| Mike Johnson | `student3@test.com` | `test123` | STU003 | 11A | Computer Applications |

**How to login as a Student:**
1. Go to the login page
2. Select "Student" role
3. Use any email/password combination above
4. Click "Sign In"

### 👨‍💼 Admin Accounts

| Name | Email | Password | Department | Employee ID |
|------|-------|----------|------------|-------------|
| Prof. Sarah Wilson | `admin1@test.com` | `admin123` | Computer Science | ADMIN001 |
| Dr. Robert Davis | `admin2@test.com` | `admin123` | Information Technology | ADMIN002 |

**How to login as an Admin:**
1. Go to the login page
2. Select "Admin" role
3. Use any email/password combination above
4. Click "Sign In as Admin"

### 🔐 Super Admin Account

| Role | Secret Code |
|------|-------------|
| Super Admin | `admin@2024` |

**How to login as Super Admin:**
1. Go to the login page
2. Click the secret toggle (click multiple times on "Admin" to reveal Super Admin option)
3. Select "Super Admin" role
4. Enter secret code: `admin@2024`
5. Click "Sign In as Super Admin"

## 🎯 What Each Role Can Do

### Student Features
- ✅ Take aptitude tests
- ✅ Take technical assessments
- ✅ Take coding challenges
- ✅ View their own test results
- ✅ Access student dashboard
- ✅ View problem statements
- ✅ Submit solutions

### Admin Features
- ✅ View all students and their activity
- ✅ Monitor real-time student sessions
- ✅ View all test submissions and results
- ✅ Generate reports and analytics
- ✅ Export data as CSV
- ✅ View student violations and proctoring data
- ✅ Access admin dashboard
- ❌ Cannot take tests (admin role restriction)

### Super Admin Features
- ✅ All admin features
- ✅ User management (view all users)
- ✅ Role management
- ✅ System-wide analytics
- ✅ Access to super admin dashboard
- ✅ Advanced debugging tools

## 🔧 Development Notes

### For Developers
- Test accounts are defined in `/src/config/testAccounts.js`
- The `TestLogin` component provides the quick login interface
- Test accounts are automatically created when needed (no manual setup required)
- All test data is stored locally or in the configured database

### Customizing Test Accounts
To add or modify test accounts, edit the `TEST_ACCOUNTS` object in `/src/config/testAccounts.js`:

```javascript
// Add a new student account
STUDENTS: [
  // existing accounts...
  {
    email: 'newstudent@test.com',
    password: 'test123',
    displayName: 'New Student',
    role: 'student',
    profile: {
      rollNumber: 'STU004',
      class: '10A',
      section: 'Mathematics'
    }
  }
]
```

## 🚨 Security Notes

### ⚠️ Important for Production
- **Remove test accounts before deploying to production**
- **Change the super admin secret code**
- **Use proper authentication in production environments**
- Test accounts are for development only and should not be used in live systems

### Environment Detection
The test accounts feature should be disabled in production. Consider adding environment checks:

```javascript
// Only show test login in development
const isDevelopment = process.env.NODE_ENV === 'development';
```

## 🐛 Troubleshooting

### Test Login Not Working?
1. Ensure you're in development mode
2. Check browser console for any errors
3. Verify the authentication service is running
4. Clear browser cache and localStorage

### Can't Access Admin/Super Admin?
1. Make sure you're selecting the correct role on login page
2. For super admin, ensure you're using the correct secret code
3. Check that the role permissions are properly configured

### Database Issues?
1. If using Supabase, ensure the `users` table exists
2. Check that the authentication service is configured correctly
3. Verify environment variables are set properly

## 📞 Support

If you encounter issues with test accounts:
1. Check the browser console for error messages
2. Verify your authentication configuration
3. Ensure all required dependencies are installed
4. Check the application logs for detailed error information

---

**Happy Testing! 🚀**
