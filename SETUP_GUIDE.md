# Setup & Troubleshooting Guide

## Quick Setup (5 Minutes)

### 1. Install MongoDB

**Option A: Local MongoDB**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb-org

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Use it in `.env.local`

### 2. Configure Environment

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/gymtracker
JWT_SECRET=your-very-long-secret-key-at-least-32-characters
JWT_REFRESH_SECRET=your-very-long-refresh-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Generate Strong Secrets:**
```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install & Seed

```bash
# Install dependencies
npm install

# Seed exercise database
npm run seed

# Start dev server
npm run dev
```

### 4. Access the App

Open http://localhost:3000 in your browser

**First Steps:**
1. Click "Sign up" to create an account
2. Fill in your details (use a real email format)
3. Login with your new account
4. Explore the navigation

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list  # macOS

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Check connection string in .env.local
# Make sure it matches your MongoDB setup
```

### Issue: Build Errors

**Error:** TypeScript or ESLint errors

**Solutions:**
```bash
# Clean build
rm -rf .next
npm run build

# Check for missing dependencies
npm install

# Verify Node version (needs 18+)
node --version
```

### Issue: Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Issue: Seed Script Fails

**Error:** Can't connect to MongoDB when seeding

**Solutions:**
```bash
# Make sure MongoDB is running first
sudo systemctl start mongod

# Check MONGODB_URI is correct in .env.local
cat .env.local | grep MONGODB_URI

# Run seed with debug
npm run seed
```

### Issue: JWT Errors

**Error:** "Invalid or expired token"

**Solutions:**
1. Clear browser localStorage (Application tab in DevTools)
2. Logout and login again
3. Make sure JWT_SECRET and JWT_REFRESH_SECRET are set in `.env.local`
4. Don't use the example secrets in production!

### Issue: PWA Not Installing

**Symptoms:** No install prompt on mobile

**Solutions:**
- PWA disabled in dev mode (this is normal)
- Build and run production: `npm run build && npm start`
- Must be served over HTTPS (except localhost)
- Check manifest.json is accessible: http://localhost:3000/manifest.json

## Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, watch for changes
npm run lint
```

### Before Committing

```bash
# Build to check for errors
npm run build

# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Adding New Exercises

Edit `lib/seed-exercises.ts` and add to the `exercises` array:

```typescript
{
  name: 'Your Exercise',
  aliases: ['Alt Name'],
  equipment: 'barbell',
  primary_muscles: ['Chest'],
  secondary_muscles: ['Triceps'],
  category: 'push'
}
```

Then re-run: `npm run seed`

## Database Management

### View Your Data

**Using MongoDB Compass (GUI):**
1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Browse `gymtracker` database

**Using Mongo Shell:**
```bash
mongosh

use gymtracker
db.users.find()
db.exercises.find()
db.plans.find()
```

### Reset Database

```bash
mongosh

use gymtracker
db.dropDatabase()

# Then re-seed
npm run seed
```

### Backup Database

```bash
# Backup
mongodump --db gymtracker --out ./backup

# Restore
mongorestore --db gymtracker ./backup/gymtracker
```

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | - | Access token secret |
| `JWT_REFRESH_SECRET` | ✅ Yes | - | Refresh token secret |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Recommended | http://localhost:3000 | App URL |
| `OPENAI_API_KEY` | ❌ Optional | - | For LLM features |
| `NODE_ENV` | ⚠️ Auto-set | development | Environment |

## Production Deployment

### Environment Setup

**Vercel:**
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

**Environment Variables for Production:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gymtracker
JWT_SECRET=<long-random-string-32-chars-min>
JWT_REFRESH_SECRET=<different-long-random-string>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Build & Deploy

```bash
# Test production build locally
npm run build
npm start

# Or deploy to Vercel
vercel deploy --prod
```

## Testing the App

### Manual Testing Checklist

- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] Navigate between pages
- [ ] Logout
- [ ] Dark mode toggle works
- [ ] Responsive on mobile
- [ ] PWA installable (production build only)

### Check API Endpoints

```bash
# Health check (should return error without auth)
curl http://localhost:3000/api/auth/refresh

# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
```

## Performance Tips

### Development

- MongoDB indexes are created automatically
- React Query caches API responses
- Service worker only active in production

### Production

- Use `npm run build` to optimize bundle
- Enable compression on your hosting
- Use MongoDB Atlas for better performance
- Consider Redis for session storage (future enhancement)

## Getting Help

### Debug Mode

Enable debug logging:

```typescript
// In any file
console.log('Debug:', variableName)
```

Check browser console (F12) for errors

### Common Debug Points

1. **Network Tab:** Check API requests/responses
2. **Application Tab:** Check localStorage for auth state
3. **Console Tab:** Check for JavaScript errors
4. **MongoDB Logs:** Check database connection

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## Next Steps

Once you have the app running:

1. ✅ Create an account
2. ✅ Explore the navigation
3. 📋 Check `PROJECT_STATUS.md` for current features
4. 📖 Read `requirement.md` for full specifications
5. 🛠️ Start implementing pending features!

---

Need more help? Check the issues tab or create a new one!


