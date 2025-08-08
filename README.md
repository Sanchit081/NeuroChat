<<<<<<< HEAD
# SanchitVerse - NeuroChat MVP

A WhatsApp-style real-time chat application built with modern web technologies.

## Features

### Core Features
- **Authentication**: Email/password signup and login with JWT
- **Real-time Messaging**: Instant text messaging using Socket.IO
- **Message History**: Persistent message storage in MongoDB
- **Typing Indicators**: See when someone is typing
- **Message Status**: Delivered and seen indicators
- **Profile Management**: Username and profile picture setup

### Dummy Features (Coming Soon)
- Media sharing (button present but disabled)
- Group chats (screen present but non-functional)
- Status/Stories (placeholder only)

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt
- **Hosting**: Render/Heroku

### Frontend
- **Framework**: React
- **Styling**: CSS3 with responsive design
- **Real-time**: Socket.IO Client
- **Hosting**: Vercel/Netlify

## Project Structure

```
SanchitChat/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── middleware/      # Auth & validation middleware
│   │   ├── routes/          # API routes
│   │   ├── socket/          # Socket.IO handlers
│   │   └── utils/           # Helper functions
│   ├── package.json
│   └── server.js
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   └── utils/           # Helper functions
│   ├── public/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Set up environment variables (see .env.example files)
5. Start the development servers

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Messages
- `GET /api/messages/:userId` - Get chat history with a user
- `POST /api/messages` - Send a message (also via Socket.IO)

### Users
- `GET /api/users` - Get all users (for contact list)
- `GET /api/users/:id` - Get specific user

## Socket.IO Events

### Client to Server
- `join_room` - Join a chat room
- `send_message` - Send a message
- `typing` - Indicate typing status
- `stop_typing` - Stop typing indication

### Server to Client
- `receive_message` - Receive a new message
- `message_delivered` - Message delivery confirmation
- `message_seen` - Message seen confirmation
- `user_typing` - Someone is typing
- `user_stopped_typing` - Someone stopped typing

## Deployment

### Backend (Render/Heroku)
1. Create a new service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Set environment variables
5. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
=======
# NeuroChat
>>>>>>> 463f1cbb161a0be781119a36aa2fc8dcfa5dd489
