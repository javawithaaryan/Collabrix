import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Route Configurations
import workspaceRoutes from './routes/workspaces.js'; 
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Phase 10: Production Security & Hardening Layers
app.use(helmet());
app.use(express.json());

// CORS Policy Configuration
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS validation layer'));
    }
  },
  credentials: true
}));

// Rate Limiter to guard production routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this address, please try again later.'
});
app.use('/api/', apiLimiter);

// Bind Endpoint Routes
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message || 'Fatal Server Routing Core Bug' });
});

export default app;