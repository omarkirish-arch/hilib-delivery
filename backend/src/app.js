import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootFrontendPath = path.resolve(__dirname, '../../');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, styles.css, etc.)
app.use(express.static(rootFrontendPath));

// Routes de l'API REST v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Hilib Delivery Backend API', timestamp: new Date() });
});

// Handling undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ status: 'fail', message: `Route introuvable : ${req.originalUrl}` });
});

export default app;

