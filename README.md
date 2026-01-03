# Zipzo Ride-Sharing Application

A full-stack ride-sharing application built with React (Frontend) and Node.js/Express (Backend).

## Features

- **User Authentication**: Login/Register with JWT tokens
- **Ride Booking**: Book rides with real-time driver matching
- **Real-time Updates**: Socket.IO for live ride status updates
- **User Profiles**: Manage user profiles and preferences
- **Notifications**: Real-time notifications for ride updates
- **Reports**: Report system for safety and service issues
- **Admin Dashboard**: Admin panel for managing users and rides

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for HTTP requests
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.IO for real-time communication
- Multer for file uploads
- Nodemailer for email notifications
- Twilio for SMS notifications

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd project-2
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Environment Setup

Create a `.env` file in the server directory:
```bash
cd server
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/zipzo

# JWT
JWT_SECRET=your_jwt_secret_here

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# File Upload (optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 5. Database Setup

Make sure MongoDB is running locally or update the MONGODB_URI in your .env file.

Seed the database with initial data:
```bash
cd server
npm run seed
```

## Running the Application

### Development Mode

1. **Start the Backend Server**
```bash
cd server
npm run dev
```
The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
```bash
# In a new terminal, from the root directory
npm run dev
```
The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the Frontend**
```bash
npm run build
```

2. **Start the Backend**
```bash
cd server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Rides
- `POST /api/rides/book` - Book a new ride
- `GET /api/rides/history` - Get ride history
- `GET /api/rides/active` - Get active ride
- `PUT /api/rides/:id/cancel` - Cancel a ride
- `PUT /api/rides/:id/complete` - Complete a ride

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Reports
- `POST /api/reports` - Create a report
- `GET /api/reports` - Get user reports

## Demo Credentials

You can use these demo credentials to test the application:

- **Rider**: `rider@zipzo.com` / `demo123`
- **Driver**: `driver@zipzo.com` / `demo123`
- **Admin**: `admin@zipzo.com` / `demo123`

## Project Structure

```
project-2/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── context/           # React context providers
│   ├── services/          # API services
│   ├── types/             # TypeScript type definitions
│   └── ...
├── server/                # Backend source code
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   └── ...
├── package.json          # Frontend dependencies
└── server/package.json   # Backend dependencies
```

## Features in Detail

### Real-time Communication
The application uses Socket.IO for real-time updates:
- Live ride status updates
- Driver location tracking
- Instant notifications
- Chat functionality (planned)

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- File upload security

### User Types
- **Riders**: Can book rides and track their journey
- **Drivers**: Can accept rides and update their location
- **Admins**: Can manage users, rides, and view analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@zipzo.com or create an issue in the repository. 

## Mapbox Setup

The application uses Mapbox for maps and location services. To use the map features:

1. **Get a Mapbox Access Token**:
   - Go to [Mapbox](https://www.mapbox.com/) and create an account
   - Navigate to your account dashboard
   - Create a new token or use the default public token
   - Copy your access token

2. **Set the Environment Variable**:
   Create a `.env` file in the root directory and add:
   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
   ```

3. **Features Available**:
   - Interactive map for selecting pickup and dropoff locations
   - Reverse geocoding to get addresses from map clicks
   - Route calculation with distance and duration
   - Real-time fare estimation based on distance

**Note**: The map will work with the default example token for testing, but for production use, you should get your own Mapbox token. 