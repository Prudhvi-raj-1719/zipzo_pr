const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

// Import utilities and middleware
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { cleanupOldNotifications } = require('./utils/notifications');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rideRoutes = require('./routes/rides');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io available globally
global.io = io;
app.set('io', io);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://zipzo-pr.vercel.app",
  "https://zipzo-2xczapoyk-prudhvis-projects-17cabe6e.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join ride room for real-time tracking
  socket.on('joinRide', (rideId) => {
    socket.join(`ride_${rideId}`);
    console.log(`User joined ride room: ${rideId}`);
  });

  // Leave ride room
  socket.on('leaveRide', (rideId) => {
    socket.leave(`ride_${rideId}`);
    console.log(`User left ride room: ${rideId}`);
  });

  // Handle driver location updates
  socket.on('updateLocation', (data) => {
    const { rideId, coordinates } = data;
    socket.to(`ride_${rideId}`).emit('locationUpdate', {
      coordinates,
      timestamp: new Date()
    });
  });

  // Handle emergency alerts
  socket.on('emergencyAlert', async (data) => {
    const { userId, location, message } = data;
    
    try {
      const { sendEmergencyAlert } = require('./utils/notifications');
      await sendEmergencyAlert(userId, location, message);
      
      // Broadcast to nearby users and admins
      socket.broadcast.emit('emergencyAlert', {
        userId,
        location,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Emergency alert error:', error);
    }
  });

  // Handle typing indicators for chat
  socket.on('typing', (data) => {
    socket.to(`ride_${data.rideId}`).emit('typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    socket.to(`ride_${data.rideId}`).emit('chatMessage', {
      userId: data.userId,
      message: data.message,
      timestamp: new Date()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Scheduled tasks
// Clean up old notifications daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled cleanup of old notifications...');
  try {
    await cleanupOldNotifications();
  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
  }
});

// Update driver ratings periodically
cron.schedule('0 */6 * * *', async () => {
  console.log('Updating driver ratings...');
  try {
    const User = require('./models/User');
    const Ride = require('./models/Ride');
    
    const drivers = await User.find({ role: 'driver', isActive: true });
    
    for (const driver of drivers) {
      const rides = await Ride.find({
        driver: driver._id,
        status: 'completed',
        driverRating: { $exists: true }
      });
      
      if (rides.length > 0) {
        const avgRating = rides.reduce((sum, ride) => sum + ride.driverRating, 0) / rides.length;
        await User.findByIdAndUpdate(driver._id, { rating: Math.round(avgRating * 10) / 10 });
      }
    }
    
    console.log(`Updated ratings for ${drivers.length} drivers`);
  } catch (error) {
    console.error('Rating update failed:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`
🚀 Zipzo Backend Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
⚡ Socket.IO: Enabled
📧 Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}
📱 SMS: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}
☁️  File Upload: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}
  `);
});

module.exports = app;