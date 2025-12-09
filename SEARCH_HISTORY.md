# Search History Feature

## Overview
The search history feature tracks authenticated users' GitHub profile searches and provides a dedicated page to view their search history.

## Backend Implementation

### Database Schema
- **Table**: `search_history`
- **Columns**:
  - `id` (SERIAL PRIMARY KEY)
  - `user_id` (INT, references users table)
  - `searched_username` (VARCHAR)
  - `search_type` (VARCHAR) - e.g., "status", "extended"
  - `created_at` (TIMESTAMP)

### API Endpoints

#### GET `/api/search/history`
**Authentication**: Required

Retrieves the authenticated user's search history.

**Query Parameters**:
- `limit` (optional): Number of results to return (default: 50, max: 100)

**Response**:
```json
{
  "error": false,
  "history": [
    {
      "id": 1,
      "user_id": 123,
      "searched_username": "torvalds",
      "search_type": "extended",
      "created_at": "2024-12-09T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Automatic Logging
Search history is automatically logged when authenticated users:
- Search via `GET /api/status/{username}`
- Search via `POST /api/status`
- View extended info via `GET /api/user/{username}/extended`

**Note**: Anonymous users' searches are NOT logged.

## Frontend Implementation

### New Page: `/history`
- **Location**: `frontend/app/history/page.tsx`
- **Access**: Authenticated users only (redirects to home if not logged in)
- **Features**:
  - Displays search history in reverse chronological order
  - Shows relative timestamps (e.g., "2h ago", "3d ago")
  - Click on any username to navigate to their profile
  - Displays search type (Status, Extended Info)
  - Empty state when no history exists

### Navigation
- Added "History" link to the Navbar (visible only to authenticated users)
- Desktop: Shows in center navigation with clock icon
- Mobile: Shows as icon-only button

## Files Modified

### Backend
- `backend/internal/handlers/search_handler.go` (NEW) - Search history handler
- `backend/internal/handlers/handlers.go` - Added search logging to status endpoints
- `backend/cmd/main.go` - Registered search history route

### Frontend
- `frontend/app/history/page.tsx` (NEW) - Search history page
- `frontend/components/Navbar.tsx` - Added history navigation link

## Usage

### For Users
1. Log in with GitHub OAuth
2. Search for GitHub profiles using the main search
3. Click "History" in the navigation to view your search history
4. Click any username in history to view their profile again

### For Developers
The search history is logged automatically in the background using goroutines, so it doesn't block the main request/response cycle.

To manually log a search:
```go
if user, ok := r.Context().Value("user").(*models.User); ok && s.searchHandler != nil {
    go s.searchHandler.LogSearchHistory(context.Background(), user.ID, username, "search_type")
}
```

## Privacy
- Only authenticated users' searches are tracked
- Users can only view their own search history
- Search history is tied to user accounts and deleted when accounts are deleted (CASCADE)

## Future Enhancements
- Add ability to clear search history
- Add search history filtering (by date, search type)
- Add search suggestions based on history
- Export search history
