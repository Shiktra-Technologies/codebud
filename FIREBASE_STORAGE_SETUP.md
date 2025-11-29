# 🔥 Firebase Storage Setup Guide

This guide will help you configure Firebase Storage for the CodeBud application to enable file uploads and storage management.

## 📋 Prerequisites

- Firebase project already created and connected to the app
- Admin access to Firebase Console
- Basic understanding of Firebase Storage Rules

## 🚀 Step-by-Step Setup

### 1. Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **codebud-e06c7**
3. Navigate to **Storage** in the left sidebar
4. Click **"Get Started"**
5. Choose **"Start in production mode"** (we'll configure rules next)
6. Select your preferred storage location (choose closest to your users)

### 2. Configure Storage Rules

Navigate to the **Rules** tab in Firebase Storage and replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own submissions folder
    match /submissions/{userId}/{testType}/{date}/{submissionId}/{fileName} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Allow admins and super admins to access all submission files
    match /submissions/{allPaths=**} {
      allow read, write: if request.auth != null 
        && (request.auth.token.role == 'admin' || 
            request.auth.token.role == 'super_admin');
    }
    
    // Allow users to read their own files
    match /submissions/{userId}/{allPaths=**} {
      allow read: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Set Up Custom Claims (Optional but Recommended)

To enable role-based access (admin/super_admin), you'll need to set up custom claims:

```javascript
// In Firebase Functions or Admin SDK
const admin = require('firebase-admin');

// Set custom claims for admin users
await admin.auth().setCustomUserClaims(uid, {
  role: 'admin' // or 'super_admin'
});
```

### 4. Test Storage Access

1. Save the rules in Firebase Console
2. Return to your CodeBud application
3. Navigate to Admin Dashboard → Files tab
4. Click "Try Loading Again"
5. You should now see the storage interface

## 📁 File Organization Structure

The storage service automatically organizes files as follows:

```
submissions/
├── {userId}/
│   ├── dsa/
│   │   ├── 2025-11-29/
│   │   │   ├── {submissionId}/
│   │   │   │   ├── solution.js
│   │   │   │   ├── screenshot.png
│   │   │   │   └── notes.txt
│   ├── aptitude/
│   │   ├── 2025-11-29/
│   │   │   ├── {submissionId}/
│   │   │   │   └── answers.pdf
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Storage access denied" error**
   - Check that Storage Rules are properly configured
   - Verify user authentication is working
   - Ensure custom claims are set for admin users

2. **"Storage connection failed" error**
   - Check internet connection
   - Verify Firebase project configuration
   - Check if Storage is enabled in Firebase Console

3. **Files not appearing**
   - Check browser console for errors
   - Verify file upload permissions
   - Check if files exist in Firebase Storage Console

### Debug Steps:

1. **Check Firebase Console:**
   - Go to Storage → Files
   - Verify files are actually uploaded
   - Check usage and quotas

2. **Check Browser Console:**
   - Look for Storage-related errors
   - Check network tab for failed requests
   - Verify authentication state

3. **Test with Simple Upload:**
   ```javascript
   // Test upload in browser console
   import { ref, uploadBytes } from 'firebase/storage';
   import { storage } from './firebase/config';
   
   const testRef = ref(storage, 'test/test.txt');
   const testFile = new Blob(['Hello World'], { type: 'text/plain' });
   uploadBytes(testRef, testFile).then(() => console.log('Upload successful!'));
   ```

## 📊 Storage Limits

### Firebase Storage Free Tier:
- **5GB** total storage
- **1GB/day** download
- **20,000/day** operations

### Recommended Optimizations:
- Implement file size limits (max 10MB per file)
- Use compression for images
- Clean up old/unused files regularly
- Monitor usage in Firebase Console

## 🔐 Security Best Practices

1. **Never allow public read/write access**
2. **Always authenticate users before file operations**
3. **Implement file type validation**
4. **Set file size limits**
5. **Regular security rule audits**
6. **Monitor storage usage and access patterns**

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Review Firebase Storage documentation
3. Check browser console for specific errors
4. Test with Firebase Storage emulator for development

## 🎯 Next Steps

After setup is complete:

1. ✅ Test file upload functionality
2. ✅ Verify admin access to all files
3. ✅ Test filtering and search features
4. ✅ Monitor storage usage
5. ✅ Set up backup policies if needed

---

**Note:** This setup enables secure, organized file storage for the CodeBud assessment platform with proper access controls and scalability.
