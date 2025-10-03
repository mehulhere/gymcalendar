# Gym Tracker PWA

A comprehensive Progressive Web App for tracking gym workouts, building plans, and monitoring progress with AI-powered insights.

## Features

- 📅 **Calendar Attendance**: Visual tracking with color-coded calendar
- 📝 **Workout Plans**: Create and manage detailed workout routines
- 💪 **Workout Logging**: Track sets, reps, and weights
- 📊 **Statistics**: Volume charts, muscle heatmaps, progress tracking
- 🎯 **Goals**: Weight tracking with on-track calculations
- 🤖 **AI Insights**: LLM-powered exercise tips, alternates, and insights
- 📱 **PWA**: Installable, works offline, native app-like experience

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **State**: Zustand, React Query
- **Database**: MongoDB with Mongoose
- **Auth**: JWT with HttpOnly cookies
- **PWA**: next-pwa
- **Charts**: Chart.js with react-chartjs-2

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Create a `.env.local` file based on `.env.example`:

\`\`\`env
MONGODB_URI=mongodb://localhost:27017/gymtracker
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
OPENAI_API_KEY=your-openai-key (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

4. Seed the exercise database:

\`\`\`bash
npm run seed
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app router pages
│   ├── api/               # API route handlers
│   ├── auth/              # Authentication pages
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── ...
├── lib/                   # Utilities and configurations
│   ├── models/           # Mongoose models
│   ├── stores/           # Zustand stores
│   └── ...
├── public/               # Static assets
└── scripts/              # Utility scripts
\`\`\`

## Key Features Implementation

### Authentication
- JWT-based auth with access (15min) and refresh (30d) tokens
- HttpOnly cookies for refresh token
- Protected API routes

### Workout Tracking
- Exercise dictionary with 200+ pre-seeded exercises
- Plan builder with days, exercises, sets, and reps
- Session tracking with volume calculation
- Make-up session allocation for missed days

### Progress Analytics
- Volume calculations (weight × reps)
- Weekly muscle stress tracking (>20 sets = overreached)
- Muscle heatmaps with color coding
- Weight tracking with goal progress

### PWA Features
- Offline-first design
- Installable on mobile and desktop
- Service worker for caching
- Touch-optimized UI (44px+ touch targets)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed exercise database

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.


