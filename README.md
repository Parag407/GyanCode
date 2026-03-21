# GyanCode Platform

A modern, AI-powered coding platform for students and educators.

## Features

- **Automated Coding Assignments**: Create and solve coding problems with real-time execution.
- **AI Tutor & Hints**: Integrated AI support for students to learn and debug.
- **Admin & Educator Dashboards**: Comprehensive tools for managing users, assignments, and tracking performance.
- **Certification System**: Automated and manual certificate issuance for achievements.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Chart.js.
- **Backend**: Node.js, Express, Supabase (PostgreSQL).
- **AI Integration**: Google Gemini API, OpenRouter (DeepSeek R1 fallback).

## Deployment

### Prerequisites

- Node.js (v18+)
- Supabase Account & Project
- Google Gemini API Key
- OpenRouter API Key (Optional fallback)

### Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env` and fill in your Supabase and AI keys.
   - Copy `frontend/.env.example` to `frontend/.env` and fill in your Supabase variables.
4. Run locally:
   ```bash
   npm run dev
   ```

## License

MIT
