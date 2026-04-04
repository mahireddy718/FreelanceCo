# Prolance API Documentation

Complete API reference for all backend endpoints with Postman testing examples.

**Base URL**: `http://localhost:8080`

**Production URL**: (Your deployed backend URL)

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Auth Endpoints](#auth-endpoints)
3. [User Endpoints](#user-endpoints)
4. [Project Endpoints](#project-endpoints)
5. [Application Endpoints](#application-endpoints)
6. [Contract Endpoints](#contract-endpoints)
7. [Chat/Messaging Endpoints](#chatmessaging-endpoints)
8. [Payment Endpoints](#payment-endpoints)
9. [Settings Endpoints](#settings-endpoints)
10. [Notification Endpoints](#notification-endpoints)
11. [Upload Endpoints](#upload-endpoints)
12. [Admin Endpoints](#admin-endpoints)
13. [AI Endpoints](#ai-endpoints)
14. [CAPTCHA Endpoints](#captcha-endpoints)

---

## Authentication & Authorization

### Authentication Types

1. **No Auth** - Public endpoints
2. **Bearer Token** - Requires JWT token from login
3. **Admin Auth** - Requires admin JWT token

### Getting a Token

Login to get your JWT token:

```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response includes `jwtToken`. Use this in headers:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## Auth Endpoints

Base path: `/auth`

### 1. User Signup

**POST** `/auth/signup`

Register a new user account.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "freelancer"
}
```

**Fields:**
- `name` (required): User's full name
- `email` (required): Valid email address
- `password` (required): Minimum 6 characters
- `role` (optional): `freelancer`, `client`, or `both` (default: `freelancer`)

**Success Response (201):**
```json
{
  "message": "Signup successful",
  "success": true
}
```

**Error Response (409):**
```json
{
  "message": "User with this email already exists, you can login",
  "success": false
}
```

---

### 2. User Login

**POST** `/auth/login`

Authenticate and receive JWT token.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "success": true,
  "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "john@example.com",
  "name": "John Doe",
  "username": "john",
  "role": "freelancer",
  "userId": "507f1f77bcf86cd799439011",
  "isAdmin": false
}
```

---

### 3. Firebase Authentication

**POST** `/auth/firebase-auth`

Login/signup with Firebase (Google/GitHub).

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@gmail.com",
  "name": "User Name",
  "firebaseUid": "firebase_uid_here",
  "photoURL": "https://example.com/photo.jpg"
}
```

---

### 4. Update User Role

**POST** `/auth/update-role`

Update role for Google-authenticated users.

**Auth:** Required (Bearer Token)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "role": "client"
}
```

**Allowed roles:** `freelancer`, `client`, `both`

---

### 5. Forgot Password

**POST** `/auth/forgot-password`

Request OTP for password reset.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "john@example.com"
}
```

**Note:** `identifier` can be either email or username

**Success Response (200):**
```json
{
  "message": "OTP sent to your email successfully",
  "success": true,
  "email": "jo***@example.com"
}
```

---

### 6. Verify OTP

**POST** `/auth/verify-otp`

Verify OTP for password reset.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "OTP verified successfully",
  "success": true,
  "email": "john@example.com"
}
```

---

### 7. Reset Password

**POST** `/auth/reset-password`

Reset password with verified OTP.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully",
  "success": true
}
```

---

## User Endpoints

Base path: `/api/users`

### 1. Get Current User Profile

**GET** `/api/users/me`

Get authenticated user's profile.

**Auth:** Required

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "john",
    "role": "freelancer",
    "bio": "Full stack developer",
    "skills": ["JavaScript", "React", "Node.js"],
    "avatar": "https://cloudinary.com/avatar.jpg",
    "rating": 4.5,
    "totalReviews": 10,
    "completedProjects": 5
  }
}
```

---

### 2. Update Profile

**PUT** `/api/users/profile`

Update user profile information.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "name": "John Updated",
  "bio": "Senior Full Stack Developer",
  "location": "New York, USA",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"]
}
```

---

### 3. Add Portfolio Item

**POST** `/api/users/portfolio`

Add a portfolio item to user profile.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "E-commerce Website",
  "description": "Built a full-stack e-commerce platform",
  "imageUrl": "https://cloudinary.com/project.jpg",
  "link": "https://example.com"
}
```

---

### 4. Remove Portfolio Item

**DELETE** `/api/users/portfolio/:itemId`

Remove a portfolio item.

**Auth:** Required

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**URL Params:**
- `itemId`: Portfolio item ID

---

### 5. Get Active Projects Count

**GET** `/api/users/active-projects-count`

Get count of active projects for current user.

**Auth:** Required

**Success Response (200):**
```json
{
  "success": true,
  "activeProjectsCount": 3
}
```

---

### 6. Delete Account

**DELETE** `/api/users/delete-account`

Permanently delete user account.

**Auth:** Required

**⚠️ Warning:** This action is irreversible and deletes all user data.

---

### 7. Search Freelancers

**GET** `/api/users/search?skills=React,Node.js&location=USA`

Search for freelancers (public).

**Query Params:**
- `skills`: Comma-separated skills
- `location`: Location filter
- `minRating`: Minimum rating (0-5)
- `experienceLevel`: `beginner`, `intermediate`, `expert`

**Success Response (200):**
```json
{
  "success": true,
  "freelancers": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "username": "john",
      "skills": ["React", "Node.js"],
      "rating": 4.5,
      "totalReviews": 10
    }
  ]
}
```

---

### 8. Get User by ID

**GET** `/api/users/:id`

Get user profile by ID (public, limited info).

**URL Params:**
- `id`: User ID

---

### 9. Get User by Username

**GET** `/api/users/username/:username`

Get user profile by username.

**URL Params:**
- `username`: Username

**Auth:** Optional (shows more info if authenticated)

---

## Project Endpoints

Base path: `/api/projects`

### 1. Get All Projects

**GET** `/api/projects`

Get all public projects.

**Query Params:**
- `category`: Filter by category
- `minBudget`: Minimum budget
- `maxBudget`: Maximum budget
- `status`: `open`, `in_progress`, `completed`

---

### 2. Get Project by ID

**GET** `/api/projects/:id`

Get detailed project information.

**URL Params:**
- `id`: Project ID

---

### 3. Create Project

**POST** `/api/projects`

Create a new project (clients only).

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "Build an E-commerce Website",
  "description": "Need a full-stack developer to build...",
  "category": "Web Development",
  "budget": {
    "min": 1000,
    "max": 3000
  },
  "duration": "1-3 months",
  "skills": ["React", "Node.js", "MongoDB"],
  "thumbnail": "https://cloudinary.com/thumb.jpg"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "projectId": "507f1f77bcf86cd799439011"
}
```

---

### 4. Get My Projects

**GET** `/api/projects/my/projects`

Get all projects created by authenticated user.

**Auth:** Required

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 5. Update Project

**PUT** `/api/projects/:id`

Update project details.

**Auth:** Required (must be project owner)

**URL Params:**
- `id`: Project ID

**Body:** Same as Create Project

---

### 6. Delete Project

**DELETE** `/api/projects/:id`

Delete a project.

**Auth:** Required (must be project owner)

---

### 7. Get Project Workspace

**GET** `/api/projects/:id/workspace`

Get project workspace with tasks, milestones, etc.

**Auth:** Required (must be project participant)

---

### 8. Update Work Status

**PATCH** `/api/projects/:id/work-status`

Update project work status.

**Auth:** Required

**Body:**
```json
{
  "status": "in_progress"
}
```

**Allowed statuses:** `not_started`, `in_progress`, `review`, `completed`

---

### 9. Submit Work

**POST** `/api/projects/:id/submit-work`

Submit work for review.

**Auth:** Required

**Body:**
```json
{
  "message": "Work completed. Please review.",
  "deliverables": [
    "https://cloudinary.com/file1.zip"
  ]
}
```

---

### 10. Accept Project

**POST** `/api/projects/:id/accept-project`

Accept completed project (client).

**Auth:** Required

**Body:**
```json
{
  "rating": 5,
  "review": "Excellent work!"
}
```

---

### 11. Request Review

**POST** `/api/projects/:id/request-review`

Request client review.

**Auth:** Required

---

### 12. Add Milestone

**POST** `/api/projects/:id/milestones`

Add project milestone.

**Auth:** Required

**Body:**
```json
{
  "title": "Phase 1: Design",
  "description": "Complete UI/UX design",
  "dueDate": "2025-01-31",
  "amount": 500
}
```

---

### 13. Update Milestone

**PATCH** `/api/projects/:id/milestones/:milestoneId`

Update milestone status.

**Auth:** Required

**Body:**
```json
{
  "status": "completed"
}
```

---

### 14. Add Deliverable

**POST** `/api/projects/:id/deliverables`

Add project deliverable.

**Auth:** Required

**Body:**
```json
{
  "title": "Website Source Code",
  "fileUrl": "https://cloudinary.com/code.zip",
  "description": "Complete source code"
}
```

---

### 15. Delete Deliverable

**DELETE** `/api/projects/:id/deliverables/:deliverableId`

Delete a deliverable.

**Auth:** Required

---

### 16. Add Work Note

**POST** `/api/projects/:id/work-notes`

Add a work note/update.

**Auth:** Required

**Body:**
```json
{
  "note": "Completed the homepage design"
}
```

---

### 17. Update Progress

**PATCH** `/api/projects/:id/progress`

Update project progress percentage.

**Auth:** Required

**Body:**
```json
{
  "progress": 75
}
```

---

## Application Endpoints

Base path: `/api/applications`

### 1. Submit Application

**POST** `/api/applications`

Apply to a project.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "coverLetter": "I am interested in this project because...",
  "proposedBudget": {
    "min": 1200,
    "max": 2500
  },
  "proposedDuration": "2-3 months"
}
```

---

### 2. Get My Applications

**GET** `/api/applications/my`

Get all applications submitted by authenticated user.

**Auth:** Required

---

### 3. Get Pending Applications Count

**GET** `/api/applications/pending/count`

Get count of pending applications.

**Auth:** Required

---

### 4. Get Applications by Project

**GET** `/api/applications/project/:projectId`

Get all applications for a specific project.

**Auth:** Required (must be project owner)

**URL Params:**
- `projectId`: Project ID

---

### 5. Update Application Status

**PATCH** `/api/applications/:id/status`

Accept/reject an application.

**Auth:** Required (must be project owner)

**URL Params:**
- `id`: Application ID

**Body:**
```json
{
  "status": "accepted",
  "clientNotes": "Great proposal! Let's start."
}
```

**Allowed statuses:** `accepted`, `rejected`

---

### 6. Get Application by ID

**GET** `/api/applications/:id`

Get application details.

**Auth:** Required

---

## Contract Endpoints

Base path: `/api/contracts`

### 1. Propose Contract

**POST** `/api/contracts`

Propose a contract after accepting application.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "projectId": "507f1f77bcf86cd799439012",
  "freelancerId": "507f1f77bcf86cd799439013",
  "amount": 2000,
  "duration": "2 months",
  "terms": "Payment in 2 milestones...",
  "milestones": [
    {
      "title": "Phase 1",
      "amount": 1000,
      "dueDate": "2025-01-31"
    }
  ]
}
```

---

### 2. Get Contracts by Conversation

**GET** `/api/contracts/conversation/:conversationId`

Get all contracts in a conversation.

**Auth:** Required

---

### 3. Get My Contracts

**GET** `/api/contracts/my`

Get all contracts for authenticated user.

**Auth:** Required

---

### 4. Update Contract Status

**PATCH** `/api/contracts/:id/status`

Accept/reject a contract.

**Auth:** Required

**URL Params:**
- `id`: Contract ID

**Body:**
```json
{
  "status": "accepted"
}
```

**Allowed statuses:** `accepted`, `rejected`

---

## Chat/Messaging Endpoints

Base path: `/api/chat`

### 1. Get Conversations

**GET** `/api/chat/conversations`

Get all conversations for authenticated user.

**Auth:** Required

**Success Response (200):**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "participants": [...],
      "lastMessage": {
        "content": "Hello!",
        "senderId": "507f...",
        "createdAt": "2025-01-01T10:00:00Z"
      },
      "lastMessageAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Conversation by ID

**GET** `/api/chat/conversations/:id`

Get conversation with all messages.

**Auth:** Required

**URL Params:**
- `id`: Conversation ID

---

### 3. Send Message

**POST** `/api/chat/messages`

Send a message in a conversation.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011",
  "content": "Hello, how are you?"
}
```

**Note:** Real-time messaging uses Socket.IO. This HTTP endpoint is for fallback.

---

### 4. Mark Messages as Read

**PATCH** `/api/chat/messages/read`

Mark conversation messages as read.

**Auth:** Required

**Body:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011"
}
```

---

### 5. Delete Message

**DELETE** `/api/chat/messages/:messageId`

Delete a message.

**Auth:** Required (must be message sender)

**URL Params:**
- `messageId`: Message ID

---

## Payment Endpoints

Base path: `/api/payments`

### 1. Create Order

**POST** `/api/payments/create-order`

Create Razorpay payment order.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "amount": 2000,
  "projectId": "507f1f77bcf86cd799439011",
  "contractId": "507f1f77bcf86cd799439012"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "order_xyz123",
    "amount": 200000,
    "currency": "INR"
  }
}
```

---

### 2. Verify Payment

**POST** `/api/payments/verify`

Verify Razorpay payment signature.

**Auth:** Required

**Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

---

### 3. Get Payment History

**GET** `/api/payments/history`

Get payment history for authenticated user.

**Auth:** Required

---

### 4. Get Payment by Project

**GET** `/api/payments/project/:projectId`

Get payment details for a specific project.

**Auth:** Required

---

### 5. Razorpay Webhook

**POST** `/api/payments/webhook`

Handle Razorpay webhook events.

**Auth:** None (verified by signature)

**Note:** Used by Razorpay to send payment status updates.

---

## Settings Endpoints

Base path: `/api/settings`

**Auth:** All endpoints require authentication

### 1. Get Settings

**GET** `/api/settings`

Get all user settings.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 2. Update Profile Info

**PUT** `/api/settings/profile`

Update profile information.

**Body:**
```json
{
  "name": "John Doe",
  "bio": "Full Stack Developer",
  "location": "New York",
  "phone": "+1234567890"
}
```

---

### 3. Update Skills

**PUT** `/api/settings/skills`

Update skills and professional details.

**Body:**
```json
{
  "skills": ["React", "Node.js", "MongoDB"],
  "experienceLevel": "expert",
  "hourlyCharges": 50
}
```

---

### 4. Change Email

**PUT** `/api/settings/email`

Change user email.

**Body:**
```json
{
  "newEmail": "newemail@example.com",
  "currentPassword": "password123"
}
```

---

### 5. Change Password

**PUT** `/api/settings/password`

Change user password.

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

---

### 6. Update Notifications

**PUT** `/api/settings/notifications`

Update notification preferences.

**Body:**
```json
{
  "inApp": true,
  "projectUpdates": true
}
```

---

### 7. Update Privacy

**PUT** `/api/settings/privacy`

Update privacy settings.

**Body:**
```json
{
  "isPublic": true,
  "whoCanMessage": "everyone",
  "showWorkHistory": true
}
```

**`whoCanMessage` values:** `everyone`, `connections`, `none`

---

## Notification Endpoints

Base path: `/api/notifications`

**Auth:** All endpoints require authentication

### 1. Get Notifications

**GET** `/api/notifications`

Get all notifications for authenticated user.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 2. Get Unread Count

**GET** `/api/notifications/unread-count`

Get count of unread notifications.

**Success Response (200):**
```json
{
  "success": true,
  "unreadCount": 5
}
```

---

### 3. Mark as Read

**PATCH** `/api/notifications/:id/read`

Mark a notification as read.

**URL Params:**
- `id`: Notification ID

---

### 4. Mark All as Read

**PATCH** `/api/notifications/read-all`

Mark all notifications as read.

---

### 5. Delete Notification

**DELETE** `/api/notifications/:id`

Delete a notification.

**URL Params:**
- `id`: Notification ID

---

## Upload Endpoints

Base path: `/api/upload`

**Auth:** All endpoints require authentication

**Note:** All endpoints use `multipart/form-data` for file uploads

### 1. Upload Profile Photo

**POST** `/api/upload/upload`

Upload profile photo.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (FormData):**
- `photo`: Image file (max 5MB)

**Success Response (200):**
```json
{
  "message": "Profile photo uploaded successfully",
  "success": true,
  "avatar": "https://res.cloudinary.com/..."
}
```

---

### 2. Delete Profile Photo

**DELETE** `/api/upload/photo`

Remove profile photo.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### 3. Upload Project Thumbnail

**POST** `/api/upload/project-thumbnail`

Upload project thumbnail image.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (FormData):**
- `thumbnail`: Image file (max 5MB)

**Success Response (200):**
```json
{
  "message": "Thumbnail uploaded successfully",
  "success": true,
  "thumbnail": "https://res.cloudinary.com/..."
}
```

---

### 4. Upload Project Images

**POST** `/api/upload/project-images`

Upload multiple project images.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (FormData):**
- `images`: Array of image files (max 5 files, 5MB each)

**Success Response (200):**
```json
{
  "message": "Images uploaded successfully",
  "success": true,
  "images": [
    "https://res.cloudinary.com/image1.jpg",
    "https://res.cloudinary.com/image2.jpg"
  ]
}
```

---

## Admin Endpoints

Base path: `/api/admin`

**Auth:** All endpoints require admin authentication

**Note:** Use admin credentials to login and get admin JWT token

### 1. Get Stats

**GET** `/api/admin/stats`

Get platform statistics.

**Headers:**
```
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalProjects": 45,
    "totalFreelancers": 120,
    "activeProjects": 12
  }
}
```

---

### 2. Get User Growth

**GET** `/api/admin/user-growth`

Get user growth data for charts.

**Headers:**
```
Authorization: Bearer ADMIN_JWT_TOKEN
```

---

### 3. Get All Users

**GET** `/api/admin/users`

Get all users with filtering.

**Query Params:**
- `role`: Filter by role
- `status`: Filter by status

---

### 4. Delete User

**DELETE** `/api/admin/users/:id`

Delete a user account.

**URL Params:**
- `id`: User ID

---

### 5. Ban User

**POST** `/api/admin/users/:id/ban`

Ban a user account.

**URL Params:**
- `id`: User ID

---

### 6. Unban User

**POST** `/api/admin/users/:id/unban`

Unban a user account.

**URL Params:**
- `id`: User ID

---

### 7. Get Freelancers

**GET** `/api/admin/freelancers`

Get all freelancers with filtering.

**Query Params:**
- `skills`: Filter by skills
- `verified`: Filter by verification status

---

### 8. Get Freelancer Stats

**GET** `/api/admin/freelancers/stats`

Get freelancer statistics.

---

### 9. Get Freelancer Details

**GET** `/api/admin/freelancers/:id`

Get detailed freelancer information.

**URL Params:**
- `id`: Freelancer ID

---

### 10. Verify Freelancer

**POST** `/api/admin/freelancers/:id/verify`

Verify a freelancer account.

**URL Params:**
- `id`: Freelancer ID

---

### 11. Unverify Freelancer

**POST** `/api/admin/freelancers/:id/unverify`

Remove verification from freelancer.

**URL Params:**
- `id`: Freelancer ID

---

## AI Endpoints

Base path: `/api/ai`

### 1. Improve Description

**POST** `/api/ai/improve-description`

Use AI to improve project/proposal descriptions.

**Auth:** Required

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "text": "need website for my business"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "improvedText": "I am looking for a professional web developer to create a modern, responsive website for my business..."
}
```

---

## CAPTCHA Endpoints

Base path: `/api/captcha`

### 1. Generate CAPTCHA

**GET** `/api/captcha/generate`

Generate a new CAPTCHA.

**Success Response (200):**
```json
{
  "success": true,
  "captchaId": "uuid-v4-string",
  "captchaSvg": "<svg>...</svg>"
}
```

**Usage:**
1. Display the SVG to user
2. Store the `captchaId`
3. User enters the text they see
4. Verify with `/verify` endpoint

---

### 2. Verify CAPTCHA

**POST** `/api/captcha/verify`

Verify CAPTCHA answer.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "captchaId": "uuid-from-generate",
  "answer": "ABCD"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "CAPTCHA verified successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Incorrect CAPTCHA"
}
```

**Note:** CAPTCHA expires after 10 minutes

---

## Postman Collection Setup

### Environment Variables

Create a Postman environment with:

```
BASE_URL: http://localhost:8080
JWT_TOKEN: (set after login)
ADMIN_TOKEN: (set after admin login)
USER_ID: (set after login)
```

### Collection Structure

```
Prolance API
├── Auth
│   ├── Signup
│   ├── Login
│   ├── Firebase Auth
│   ├── Update Role
│   ├── Forgot Password
│   ├── Verify OTP
│   └── Reset Password
├── User
│   ├── Get Profile
│   ├── Update Profile
│   ├── Portfolio (Add/Remove)
│   ├── Search
│   └── Delete Account
├── Projects
│   ├── Get All
│   ├── Create
│   ├── My Projects
│   ├── Update/Delete
│   └── Workspace
├── Applications
│   ├── Submit
│   ├── My Applications
│   └── Update Status
├── Contracts
├── Chat
├── Payments
├── Settings
├── Notifications
├── Upload
├── Admin
├── AI
└── CAPTCHA
```

### Pre-request Scripts

Add to collection level:

```javascript
// Auto-set JWT token from environment
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('JWT_TOKEN')
});
```

### Tests

Add to login endpoint:

```javascript
// Save JWT token to environment
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('JWT_TOKEN', response.jwtToken);
    pm.environment.set('USER_ID', response.userId);
}
```

---

## Error Responses

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (wrong credentials or insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description here"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production.

---

## WebSocket/Socket.IO Events

For real-time features, connect to Socket.IO:

```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: YOUR_JWT_TOKEN
  }
});

// Join conversation
socket.emit('join-conversation', conversationId);

// Send message
socket.emit('send-message', {
  conversationId,
  content: 'Hello!'
});

// Listen for new messages
socket.on('new-message', (data) => {
  console.log(data.message);
});
```

**Events:**
- `join-conversation`
- `leave-conversation`
- `send-message`
- `typing`
- `mark-read`
- `new-message` (receive)
- `messages-read` (receive)
- `user-typing` (receive)

---

## Testing Workflow

### 1. Basic Flow

```
1. Generate CAPTCHA → Verify
2. Signup → Login (get JWT)
3. Update profile/settings
4. Create project (as client)
5. Apply to project (as freelancer)
6. Accept application
7. Create contract
8. Accept contract
9. Make payment
10. Complete project
```

### 2. Admin Flow

```
1. Login as admin
2. View stats
3. Manage users (ban/verify)
4. View all projects
```

---

## Notes

- All timestamps in ISO 8601 format (UTC)
- All monetary amounts in smallest currency unit (paise for INR)
- File uploads limited to 5MB
- Password minimum 6 characters
- JWT tokens expire after 24 hours
- OTPs expire after 10 minutes
- CAPTCHAs expire after 10 minutes

---

## Support

For issues or questions about the API, contact the development team.
