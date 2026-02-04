# PumpMate Deployment Guide - Vercel + Firebase

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Firebase project

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Enter project name (e.g., "pumpmate-prod")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save changes

### 1.3 Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location close to your users
5. Click "Done"

### 1.4 Configure Security Rules
In Firestore, update rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data and station data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Station data accessible by station members
    match /stations/{stationId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.stationId == stationId;
    }
    
    // Other collections follow similar pattern
    match /{collection}/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 1.5 Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon to add web app
4. Register app with nickname
5. Copy the configuration object

## Step 2: Prepare Code for Deployment

### 2.1 Update Environment Variables
Create `.env.production` file:
```env
VITE_FIREBASE_API_KEY=AIzaSyCqwTE5Nu3eK1TFSquQZubgxfgcqD9qGUE
VITE_FIREBASE_AUTH_DOMAIN=pumpmate-1ca26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pumpmate-1ca26
VITE_FIREBASE_STORAGE_BUCKET=pumpmate-1ca26.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=403919080257
VITE_FIREBASE_APP_ID=1:403919080257:web:8ff1b7e408582b0c93efc0
```

### 2.2 Update Package.json Build Script
Ensure your `package.json` has:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub
1. Create new GitHub repository
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/pumpmate.git
git push -u origin main
```

### 3.2 Connect to Vercel
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.3 Add Environment Variables
1. In Vercel project settings
2. Go to "Environment Variables"
3. Add all Firebase config variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain in Vercel
1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 4.2 Update Firebase Auth Domain
1. In Firebase console, go to Authentication
2. Go to Settings tab
3. Add your custom domain to "Authorized domains"

## Step 5: Testing

### 5.1 Test Registration
1. Visit your deployed app
2. Click "Register your fuel station"
3. Complete registration form
4. Verify data appears in Firestore

### 5.2 Test Login
1. Login with registered credentials
2. Test different user roles
3. Verify all features work correctly

## Troubleshooting

### Build Errors
- Check all dependencies are installed
- Verify TypeScript configuration
- Ensure all imports are correct

### Firebase Connection Issues
- Verify environment variables are set correctly
- Check Firebase project settings
- Ensure Firestore rules allow access

### Authentication Problems
- Verify email/password provider is enabled
- Check authorized domains in Firebase
- Ensure proper error handling

## Monitoring and Maintenance

### Vercel Analytics
- Enable Vercel Analytics for usage insights
- Monitor performance and errors

### Firebase Usage
- Monitor Firestore usage in Firebase console
- Set up billing alerts if needed
- Regular security rule reviews

## Security Best Practices

1. **Environment Variables**: Never commit Firebase config to public repos
2. **Firestore Rules**: Implement proper security rules
3. **HTTPS**: Always use HTTPS in production
4. **Regular Updates**: Keep dependencies updated
5. **Monitoring**: Set up error tracking and monitoring

---

Your PumpMate application is now deployed and ready for use! Users can register their fuel stations and start managing operations from anywhere with internet access.