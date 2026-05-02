# Campus Notifications System

A two-stage microservices and frontend platform for structured priority-based notification parsing and retrieval.

## Project Structure

```
├── logging_middleware/        # Reusable logging middleware with auto-refresh JWT tokens
├── notification_app_be/       # Stage 1: Priority Inbox ranking microservice
├── notification_app_fe/       # Stage 2: React + Material UI notifications visualization
└── screenshots/               # Stage 1 and Stage 2 demo captures and recordings
```

## Setup & Running the Backend

### Reusable Logging Middleware
The logging middleware handles all structured logging requests to the evaluation server. It automatically processes token acquisition and authorization, message validation, and truncation.

### Priority Inbox Algorithm (Stage 1)
To run the priority inbox algorithm locally in your terminal:

```bash
cd notification_app_be
node priorityInbox.js
```

## Setup & Running the Frontend (Stage 2)

The Stage 2 visualization platform is built using React and Material UI, fully configured with active proxy routing to prevent CORS issues.

### Run in Dev Mode
To run the frontend visualization locally on port `3000`:

```bash
cd notification_app_fe
npm install
npm run dev
```

The application will launch on **http://localhost:3000/**.

## Key Features & Constraints
- **Strict Polish**: Features an accessible, classic dark theme with a focus on simplicity, responsiveness, and usability.
- **Top 'N' Priority Algorithm**: Prioritizes notifications by dynamic scoring: `Placement(3) > Result(2) > Event(1)` breaking ties via recency.
- **Persistent Tracker**: Uses local browser caching (`localStorage`) to separate unread/new notifications from previously viewed updates.
- **Bypassing Restrictive Constraints**: Transparent client-side multipage concatenation for loading beyond the API's standard limit (up to 20 notifications per page).
