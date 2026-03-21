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

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel.
2. Set the root directory to `frontend`.
3. Configure environment variables from `frontend/.env.example`.
4. Deploy.

### Backend (Render)

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`. (Alternatively, use the `Blueprint` option to use the `render.yaml` file).
4. Select **Node** as the Environment.
5. Set the **Build Command** to `npm install`.
6. Set the **Start Command** to `npm start`.
7. Add the following environment variables from `backend/.env.example`:
   - `PORT`: 5000 (or your preference)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `VITE_API_URL`: `https://gyan-code.vercel.app` (for CORS)

### Post-Deployment

- Update the `VITE_API_URL` in your **Vercel** environment variables to point to your new Render backend URL (e.g., `https://gyancode-backend.onrender.com`).
- Redeploy your frontend on Vercel to pick up the change.

## License

MIT
