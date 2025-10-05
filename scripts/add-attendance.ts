import mongoose from 'mongoose';

// Import models
import { User } from '../lib/models/User';
import { Attendance } from '../lib/models/Attendance';
import dbConnect from '../lib/db';

async function addAttendanceForUser() {
  try {
    // Connect to database
    await dbConnect();

    console.log('Connected to MongoDB');

    // Find user by email
    const userEmail = 'mehul22295@iiitd.ac.in';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`User with email ${userEmail} not found.`);

      // Check if any users exist
      const allUsers = await User.find({}, 'email name');
      if (allUsers.length === 0) {
        console.log('No users found in the database. Creating user...');
        // Create the user
        const newUser = new User({
          email: userEmail,
          name: 'Mehul', // Default name, can be updated later
          provider: 'credentials',
          settings: {
            unit: 'kg',
            timezone: 'UTC',
            equipment: [],
            theme: 'dark'
          }
        });

        await newUser.save();
        console.log(`Created new user: ${newUser.name} (${newUser.email})`);
        user = newUser;
      } else {
        console.log('Available users:');
        allUsers.forEach(u => {
          console.log(`- ${u.email} (${u.name})`);
        });
        throw new Error(`User with email ${userEmail} not found`);
      }
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
