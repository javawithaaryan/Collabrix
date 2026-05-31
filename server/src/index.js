import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import socketUtils from './utils/socket.js';

// Wrap Express instance inside an HTTP server context
const server = http.createServer(app);

// Database Connectivity Layer & Server Listener Setup
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('MongoDB connection active.');
  
  // Initialize real-time Socket.io securely using the HTTP server wrapper
  socketUtils.init(server, process.env.CLIENT_URL);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Collabrix Engine running stably on port ${PORT}`);
  });
})
.catch(err => {
  console.error('Critical Database connection error:', err);
  process.exit(1);
});