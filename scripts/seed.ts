import { seedExercises } from '../lib/seed-exercises'

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


