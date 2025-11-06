# Frontend-Backend Integration Guide

This document describes how the frontend has been integrated with the MongoDB + JWT-based user authentication backend API.

## Overview

The frontend has been migrated from Supabase authentication to a custom JWT-based authentication system that communicates with a Flask backend API running on MongoDB.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following:

```env
VITE_API_BASE_URL=http://localhost:5003
```

The default API base URL is `http://localhost:5003` if not specified.

## Architecture

### API Client (`src/lib/api.ts`)

The API client handles all communication with the backend:

- **Authentication Functions:**
  - `registerUser()` - Register a new user
  - `loginUser()` - Login existing user
  - `getCurrentUser()` - Get current authenticated user
  - `verifyToken()` - Verify JWT token validity
  - `logoutUser()` - Clear authentication data

- **Token Management:**
  - Tokens are stored in `localStorage` as `authToken`
  - User data is stored in `localStorage` as `user`
  - All authenticated requests automatically include the token in the `Authorization` header

### Auth Context (`src/lib/auth.tsx`)

The auth context provides:

- `user` - Current user object (null if not authenticated)
- `loading` - Loading state during initialization
- `signUp(email, password, name?)` - Register a new user
- `signIn(email, password)` - Login user
- `signOut()` - Logout user
- `refreshUser()` - Refresh user data from API

### Authentication Flow

1. **On App Load:**
   - Checks for stored token and user in localStorage
   - Verifies token validity with backend
   - If valid, fetches fresh user data
   - If invalid, clears stored data

2. **Registration:**
   - User submits email, password, and optional name
   - Backend creates user and returns JWT token
   - Token and user data stored in localStorage
   - User is automatically logged in

3. **Login:**
   - User submits email and password
   - Backend validates credentials and returns JWT token
   - Token and user data stored in localStorage
   - User is authenticated

4. **Authenticated Requests:**
   - Token is automatically included in `Authorization: Bearer <token>` header
   - Backend validates token on each request

5. **Logout:**
   - Clears token and user data from localStorage
   - User state is reset

## Updated Components

### Login Page (`src/pages/Login.tsx`)

- Updated to use new auth API
- Changed `fullName` to `name` (optional field)
- Redirects to `/dashboard` on successful login/registration

### Dashboard (`src/pages/Dashboard.tsx`)

- Removed Supabase dependencies
- Updated to use new user structure from auth context
- Displays user email and name
- Transcription fetching is ready for future transcription API integration

### Header (`src/components/Header.tsx`)

- Works with new auth context
- No changes needed (already compatible)

## API Endpoints Used

The frontend integrates with the following backend endpoints:

1. `POST /api/users/register` - User registration
2. `POST /api/users/login` - User login
3. `GET /api/users/me` - Get current user (requires auth)
4. `POST /api/users/verify-token` - Verify token validity
5. `GET /health` - Health check (available but not used in UI)

## User Data Structure

The user object from the API has the following structure:

```typescript
interface User {
  user_id: string;      // Email address (used as ID)
  email: string;         // User's email
  name: string;          // User's display name
  created_at: string;    // ISO timestamp
  last_login?: string;   // ISO timestamp (optional)
}
```

## Token Management

- **Storage:** Tokens are stored in browser `localStorage`
- **Expiration:** Tokens expire after 7 days (as configured in backend)
- **Validation:** Token is verified on app initialization
- **Auto-refresh:** User data is refreshed when token is validated

## Error Handling

All API errors are caught and displayed to users:

- **Registration errors:** Email already exists, invalid input, etc.
- **Login errors:** Invalid credentials
- **Token errors:** Expired or invalid tokens automatically log user out

## Remaining Supabase Dependencies

The following components still reference Supabase but are not critical for user authentication:

- `src/pages/Pricing.tsx` - Fetches subscription plans (can be migrated to separate API)
- `src/components/TranscriptionTool.tsx` - Handles transcriptions (requires transcription API integration)

These can be updated separately when their respective APIs are available.

## Testing the Integration

1. **Start the backend API:**
   ```bash
   cd "user api"
   python app.py
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Test Registration:**
   - Navigate to `/login`
   - Click "Sign Up"
   - Enter email, password, and optional name
   - Should redirect to dashboard on success

4. **Test Login:**
   - Navigate to `/login`
   - Enter registered email and password
   - Should redirect to dashboard on success

5. **Test Protected Routes:**
   - Navigate to `/dashboard` while logged in
   - Should display user information
   - Navigate to `/dashboard` while logged out
   - Should redirect to `/login`

## Troubleshooting

### CORS Errors

If you encounter CORS errors, ensure the backend API has CORS enabled for your frontend origin.

### Token Not Persisting

- Check browser console for localStorage errors
- Ensure cookies/localStorage are enabled
- Check that token is being returned from API

### Authentication Not Working

- Verify `VITE_API_BASE_URL` is set correctly
- Check backend API is running and accessible
- Check browser network tab for API request/response details
- Verify token format in localStorage

## Next Steps

1. **Transcription API Integration:** Update `TranscriptionTool.tsx` to use transcription API
2. **Subscription API Integration:** Update `Pricing.tsx` to use subscription API
3. **Error Handling:** Add more comprehensive error messages
4. **Token Refresh:** Implement automatic token refresh before expiration
5. **Loading States:** Add loading indicators for better UX

