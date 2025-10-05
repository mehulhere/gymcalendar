import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import models
import { User } from '../lib/models/User.js';
import { Attendance } from '../lib/models/Attendance.js';

async function addAttendanceForUser() {
  try {
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
    });

    console.log('Connected to MongoDB');

    // Find user by email
    const userEmail = 'mehul22295@iiitd.ac.in';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    console.log(`Found user: ${user.name} (${user._id})`);

    // Dates to check in (September and October 2024)
    const datesToCheckIn = [
      // September 2024
      new Date('2024-09-18'),
      new Date('2024-09-19'),
      new Date('2024-09-21'),
      new Date('2024-09-23'),
      new Date('2024-09-24'),
      new Date('2024-09-26'),
      new Date('2024-09-27'),
      new Date('2024-09-28'),
      new Date('2024-09-29'),
      new Date('2024-09-30'),
      // October 2024
      new Date('2024-10-01'),
      new Date('2024-10-02'),
      new Date('2024-10-03'),
      new Date('2024-10-04'),
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const date of datesToCheckIn) {
      // Set time to start of day for consistent comparison
      const checkInDate = new Date(date);
      checkInDate.setHours(0, 0, 0, 0);

      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        userId: user._id,
        date: checkInDate,
      });

      if (existingAttendance) {
        console.log(`Attendance already exists for ${checkInDate.toDateString()}: ${existingAttendance.status}`);
        existingCount++;
      } else {
        // Create new attendance record
        const newAttendance = new Attendance({
          userId: user._id,
          date: checkInDate,
          status: 'attended',
        });

        await newAttendance.save();
        console.log(`Created attendance record for ${checkInDate.toDateString()}`);
        createdCount++;
      }
    }

    console.log(`\nSummary:`);
    console.log(`Created: ${createdCount} new attendance records`);
    console.log(`Already existing: ${existingCount} records`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
addAttendanceForUser();
