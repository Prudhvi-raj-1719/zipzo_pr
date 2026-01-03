# Zipzo Backend API

A comprehensive Node.js backend for the Zipzo ride-sharing application with real-time features, authentication, and admin management.

## 🚀 Features

### Core Functionality
- **Multi-role Authentication** (Riders, Drivers, Admins)
- **Real-time Ride Tracking** with Socket.IO
- **Geospatial Queries** for nearby drivers and ride matching
- **File Upload** with Cloudinary integration
- **Email & SMS Notifications** 
- **Emergency Alert System**
- **Report & Dispute Management**
- **Driver Verification System**
- **Real-time Chat** during rides

### Security & Performance
- **JWT Authentication** with secure session handling
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator
- **Error Handling** with comprehensive logging
- **CORS Configuration** for frontend integration
- **Helmet.js** for security headers
- **Data Compression** for optimized responses

### Database & Architecture
- **MongoDB** with Mongoose ODM
- **Geospatial Indexing** for location-based queries
- **Scheduled Tasks** for maintenance and updates
- **Modular Architecture** with clean separation of concerns
- **RESTful API Design** with consistent response formats

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Cloudinary account (for file uploads)
- Twilio account (for SMS)
- Gmail account (for emails)

## 🛠️ Installation

1. **Clone and navigate to server directory**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/zipzo

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. **Start MongoDB**
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Seed the database (optional)**
```bash
npm run seed
```

6. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "rider",
  "gender": "male",
  "emergencyContact": "+1234567999"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Ride Management

#### Book a Ride
```http
POST /api/rides
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickup": {
    "address": "Times Square, New York",
    "coordinates": [-73.9857, 40.7580]
  },
  "destination": {
    "address": "Central Park, New York",
    "coordinates": [-73.9654, 40.7829]
  },
  "isEmergency": false,
  "shareRoute": false,
  "paymentMethod": "cash"
}
```

#### Get Available Rides (Driver)
```http
GET /api/rides/available?lat=40.7128&lng=-74.0060&radius=10000
Authorization: Bearer <token>
```

#### Accept Ride (Driver)
```http
PUT /api/rides/:rideId/accept
Authorization: Bearer <token>
```

### User Management

#### Get Dashboard Stats
```http
GET /api/users/dashboard-stats
Authorization: Bearer <token>
```

#### Update Location (Driver)
```http
PUT /api/users/update-location
Authorization: Bearer <token>
Content-Type: application/json

{
  "coordinates": [-74.0060, 40.7128]
}
```

#### Toggle Online Status (Driver)
```http
PUT /api/users/toggle-online
Authorization: Bearer <token>
```

### Notifications

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer <token>
```

### Reports & Disputes

#### Create Report
```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "reported": "userId",
  "ride": "rideId",
  "type": "inappropriate_behavior",
  "description": "Driver was rude and unprofessional"
}
```

## 🔌 Real-time Features (Socket.IO)

### Connection Events
```javascript
// Client-side connection
const socket = io('http://localhost:5000');

// Join user room for notifications
socket.emit('join', userId);

// Join ride room for tracking
socket.emit('joinRide', rideId);
```

### Location Updates
```javascript
// Driver sends location updates
socket.emit('updateLocation', {
  rideId: 'ride123',
  coordinates: [-74.0060, 40.7128]
});

// Rider receives location updates
socket.on('locationUpdate', (data) => {
  console.log('Driver location:', data.coordinates);
});
```

### Emergency Alerts
```javascript
// Send emergency alert
socket.emit('emergencyAlert', {
  userId: 'user123',
  location: 'Times Square, NY',
  message: 'Need immediate help'
});
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  role: ['rider', 'driver', 'admin'],
  isVerified: Boolean,
  isActive: Boolean,
  
  // Rider fields
  gender: String,
  emergencyContact: String,
  preferFemaleDrivers: Boolean,
  
  // Driver fields
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  licenseNumber: String,
  rating: Number,
  totalRides: Number,
  isOnline: Boolean,
  currentLocation: GeoJSON Point
}
```

### Ride Model
```javascript
{
  rider: ObjectId (User),
  driver: ObjectId (User),
  status: ['requested', 'accepted', 'in-progress', 'completed', 'cancelled'],
  pickup: {
    address: String,
    coordinates: [Number] // [longitude, latitude]
  },
  destination: {
    address: String,
    coordinates: [Number]
  },
  estimatedFare: Number,
  actualFare: Number,
  distance: Number,
  isEmergency: Boolean,
  shareRoute: Boolean,
  paymentMethod: ['cash', 'upi', 'card'],
  ratings: {
    driverRating: Number,
    riderRating: Number
  }
}
```

## 🔧 Utility Functions

### Distance Calculation
```javascript
const { calculateDistance } = require('./utils/rideUtils');

const distance = calculateDistance(
  [-73.9857, 40.7580], // Times Square
  [-73.9654, 40.7829]  // Central Park
);
console.log(`Distance: ${distance} km`);
```

### Fare Calculation
```javascript
const { calculateFare } = require('./utils/rideUtils');

const fare = calculateFare(5.2, true, false); // distance, isEmergency, isShared
console.log(`Fare: $${fare}`);
```

### Find Nearby Drivers
```javascript
const { findNearbyDrivers } = require('./utils/rideUtils');

const drivers = await findNearbyDrivers(
  [-73.9857, 40.7580], // coordinates
  10000,                // radius in meters
  true                  // preferFemale
);
```

## 📱 Notification System

### Send Email
```javascript
const { sendEmail } = require('./utils/email');

await sendEmail({
  email: 'user@example.com',
  subject: 'Ride Confirmation',
  message: 'Your ride has been confirmed!'
});
```

### Send SMS
```javascript
const { sendSMS } = require('./utils/sms');

await sendSMS('+1234567890', 'Your driver has arrived!');
```

### Push Notifications
```javascript
const { sendNotification } = require('./utils/notifications');

await sendNotification(userId, {
  title: 'New Ride Request',
  message: 'You have a new ride request nearby',
  type: 'ride_request',
  data: { rideId: 'ride123' }
});
```

## 🔒 Security Features

### JWT Authentication
- Secure token generation and validation
- Automatic token expiration
- Role-based access control

### Input Validation
- Request body validation with express-validator
- SQL injection prevention
- XSS protection

### Rate Limiting
- API endpoint protection
- IP-based request limiting
- Configurable time windows

## 📊 Monitoring & Logging

### Health Check
```http
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### Error Logging
- Comprehensive error tracking
- Environment-specific logging levels
- Structured log format

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection strings
- API keys for third-party services
- JWT secrets
- CORS origins

### Production Considerations
- Use PM2 for process management
- Set up MongoDB replica sets
- Configure reverse proxy (Nginx)
- Enable SSL/TLS certificates
- Set up monitoring and alerting

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### API Testing with Postman
Import the provided Postman collection for comprehensive API testing.

## 📈 Performance Optimization

### Database Indexing
- Geospatial indexes for location queries
- Compound indexes for efficient filtering
- TTL indexes for automatic cleanup

### Caching Strategy
- Redis integration for session storage
- Query result caching
- Static asset caching

### Load Balancing
- Horizontal scaling support
- Session affinity for Socket.IO
- Database connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for the Zipzo ride-sharing platform**