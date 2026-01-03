const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Ride = require('../models/Ride');
const Notification = require('../models/Notification');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@zipzo.com',
    phone: '+1234567890',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
    isActive: true
  },
  {
    name: 'John Rider',
    email: 'john.rider@example.com',
    phone: '+1234567891',
    password: 'password123',
    role: 'rider',
    gender: 'male',
    emergencyContact: '+1234567999',
    preferFemaleDrivers: false,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Jane Rider',
    email: 'jane.rider@example.com',
    phone: '+1234567892',
    password: 'password123',
    role: 'rider',
    gender: 'female',
    emergencyContact: '+1234567998',
    preferFemaleDrivers: true,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Mike Driver',
    email: 'mike.driver@example.com',
    phone: '+1234567893',
    password: 'password123',
    role: 'driver',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Silver',
      licensePlate: 'ABC-1234'
    },
    licenseNumber: 'DL123456789',
    rating: 4.8,
    totalRides: 150,
    totalEarnings: 2500.00,
    isOnline: true,
    isVerified: true,
    isActive: true,
    currentLocation: {
      type: 'Point',
      coordinates: [-74.006, 40.7128] // New York coordinates
    }
  },
  {
    name: 'Sarah Driver',
    email: 'sarah.driver@example.com',
    phone: '+1234567894',
    password: 'password123',
    role: 'driver',
    gender: 'female',
    vehicleInfo: {
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      color: 'Blue',
      licensePlate: 'XYZ-5678'
    },
    licenseNumber: 'DL987654321',
    rating: 4.9,
    totalRides: 200,
    totalEarnings: 3200.00,
    isOnline: true,
    isVerified: true,
    isActive: true,
    currentLocation: {
      type: 'Point',
      coordinates: [-74.0059, 40.7589] // New York coordinates
    }
  },
  {
    name: 'Bob Driver',
    email: 'bob.driver@example.com',
    phone: '+1234567895',
    password: 'password123',
    role: 'driver',
    vehicleInfo: {
      make: 'Ford',
      model: 'Focus',
      year: 2021,
      color: 'Red',
      licensePlate: 'DEF-9012'
    },
    licenseNumber: 'DL456789123',
    rating: 4.7,
    totalRides: 120,
    totalEarnings: 1800.00,
    isOnline: false,
    isVerified: true,
    isActive: true,
    currentLocation: {
      type: 'Point',
      coordinates: [-74.0445, 40.6892] // New York coordinates
    }
  }
];

const sampleRides = [
  {
    pickup: {
      address: 'Times Square, New York, NY',
      coordinates: [-73.9857, 40.7580]
    },
    destination: {
      address: 'Central Park, New York, NY',
      coordinates: [-73.9654, 40.7829]
    },
    estimatedFare: 15.50,
    actualFare: 16.00,
    distance: 2.5,
    estimatedDuration: 12,
    actualDuration: 15,
    status: 'completed',
    isEmergency: false,
    shareRoute: false,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
    driverRating: 5,
    riderRating: 5,
    driverFeedback: 'Great passenger!',
    riderFeedback: 'Excellent driver, very professional!'
  },
  {
    pickup: {
      address: 'Brooklyn Bridge, New York, NY',
      coordinates: [-73.9969, 40.7061]
    },
    destination: {
      address: 'Statue of Liberty, New York, NY',
      coordinates: [-74.0445, 40.6892]
    },
    estimatedFare: 22.00,
    actualFare: 24.50,
    distance: 4.2,
    estimatedDuration: 18,
    actualDuration: 22,
    status: 'completed',
    isEmergency: false,
    shareRoute: true,
    paymentMethod: 'upi',
    paymentStatus: 'completed',
    requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    driverRating: 4,
    riderRating: 5,
    riderFeedback: 'Good service, on time!'
  },
  {
    pickup: {
      address: 'JFK Airport, New York, NY',
      coordinates: [-73.7781, 40.6413]
    },
    destination: {
      address: 'Manhattan, New York, NY',
      coordinates: [-73.9712, 40.7831]
    },
    estimatedFare: 45.00,
    distance: 26.8,
    estimatedDuration: 45,
    status: 'requested',
    isEmergency: true,
    shareRoute: false,
    paymentMethod: 'card',
    paymentStatus: 'pending',
    requestedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Ride.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    }

    // Create rides with proper user references
    const riders = createdUsers.filter(user => user.role === 'rider');
    const drivers = createdUsers.filter(user => user.role === 'driver');

    for (let i = 0; i < sampleRides.length; i++) {
      const rideData = sampleRides[i];
      const rider = riders[i % riders.length];
      const driver = rideData.status !== 'requested' ? drivers[i % drivers.length] : null;

      const ride = await Ride.create({
        ...rideData,
        rider: rider._id,
        driver: driver ? driver._id : null
      });

      console.log(`✅ Created ride: ${ride.pickup.address} → ${ride.destination.address}`);
    }

    // Create sample notifications
    const admin = createdUsers.find(user => user.role === 'admin');
    const sampleNotifications = [
      {
        user: riders[0]._id,
        title: '🎉 Welcome to Zipzo!',
        message: 'Your account has been created successfully. Start booking rides now!',
        type: 'success'
      },
      {
        user: drivers[0]._id,
        title: '✅ Driver Verification Complete',
        message: 'Your driver account has been verified. You can now start accepting rides!',
        type: 'success'
      },
      {
        user: admin._id,
        title: '📊 Daily Report',
        message: 'System is running smoothly. 15 rides completed today.',
        type: 'info'
      }
    ];

    for (const notificationData of sampleNotifications) {
      await Notification.create(notificationData);
    }
    console.log('✅ Created sample notifications');

    console.log(`
🎉 Database seeding completed successfully!

📊 Summary:
- Users created: ${createdUsers.length}
  - Admins: ${createdUsers.filter(u => u.role === 'admin').length}
  - Riders: ${createdUsers.filter(u => u.role === 'rider').length}
  - Drivers: ${createdUsers.filter(u => u.role === 'driver').length}
- Rides created: ${sampleRides.length}
- Notifications created: ${sampleNotifications.length}

🔐 Login Credentials:
Admin: admin@zipzo.com / admin123
Rider: john.rider@example.com / password123
Driver: mike.driver@example.com / password123

🚀 You can now start the server and test the application!
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
connectDB().then(() => {
  seedDatabase();
});