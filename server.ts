import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { getDb } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import profileRoutes from './server/routes/profileRoutes.js';
import conditionRoutes from './server/routes/conditionRoutes.js';
import medicineRoutes from './server/routes/medicineRoutes.js';
import reminderRoutes from './server/routes/reminderRoutes.js';
import dietRoutes from './server/routes/dietRoutes.js';
import exerciseRoutes from './server/routes/exerciseRoutes.js';
import vitalsRoutes from './server/routes/vitalsRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize SQLite database
  await getDb();

  // Basic security and parsing middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/conditions', conditionRoutes);
  app.use('/api/medicines', medicineRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/diet', dietRoutes);
  app.use('/api/exercise', exerciseRoutes);
  app.use('/api/vitals', vitalsRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Healthify', time: new Date().toISOString() });
  });

  // Global Error Handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error occurred',
    });
  });

  // Vite integration: development vs production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 Healthify server running at http://0.0.0.0:${PORT}`);
    console.log(`Demo account available: demo@healthify.app / Demo@1234`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
