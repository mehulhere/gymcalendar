# Gym Tracker PWA

A comprehensive Progressive Web App for tracking gym workouts, building plans, and monitoring progress with AI-powered insights.

## Features

- 📅 **Calendar Attendance**: Visual tracking with color-coded calendar
- 📝 **Workout Plans**: Create and manage detailed workout routines
- 💪 **Workout Logging**: Track sets, reps, and weights
- 📊 **Statistics**: Volume charts, muscle heatmaps, progress tracking
- 🎯 **Goals**: Weight tracking with on-track calculations
- 🤖 **AI Insights**: LLM-powered exercise tips, alternates, and insights
- 🔐 **Authentication**: JWT-based auth with Google OAuth support
- 🔑 **Password Reset**: Email-based password recovery
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

3. Create a `.env.local` file based on the required environment variables:

\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017/gymtracker

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (for password reset - optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# NextAuth URL (for production)
NEXTAUTH_URL=https://your-domain.com

# OpenAI API Key (optional)
OPENAI_API_KEY=your-openai-key
\`\`\`

4. Seed the exercise database:

\`\`\`bash
npm run seed
\`\`\`

5. Set up Google OAuth (optional):

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select existing one
   c. Enable Google+ API
   d. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   e. Set authorized redirect URI to: `http://localhost:3000/api/auth/google` (for development)
   f. Add production redirect URI: `https://your-domain.com/api/auth/google` (for production)
   g. Copy Client ID and Client Secret to your `.env.local`

6. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000)

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
- Google OAuth integration for social login
- Password reset via email with secure tokens
- Multi-provider support (credentials, Google)

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


