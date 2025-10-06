import dotenv from 'dotenv'
import { seedExercises } from '../lib/seed-exercises'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  try {
    console.log('Starting database seed...')
    await seedExercises()
    console.log('Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

main()


