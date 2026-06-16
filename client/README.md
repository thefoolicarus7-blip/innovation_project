# Nysa Company Portal (React + Redux)

Company portal for hiring operations with RBAC-ready authentication.

## Features

- Company login with role selector (`company` enabled, `admin` reserved)
- Redux Toolkit state management
- Protected routes with RBAC checks
- Jobs listing + create new job form
- Applications management and candidate profile navigation
- Candidates directory and detailed candidate profile
- Company analytics overview
- Company profile management (address, type, industry, team size, etc.)

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment

Optional API base URL (falls back to local mock data if unavailable):

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

## Routes

- `/login`
- `/portal/jobs`
- `/portal/applications`
- `/portal/candidates`
- `/portal/candidates/:candidateId`
- `/portal/analytics`
- `/portal/company`
