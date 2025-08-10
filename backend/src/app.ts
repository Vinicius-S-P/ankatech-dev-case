import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import dataRoutes from './routes/dataRoutes';
import investmentRoutes from './routes/investmentRoutes';
import allocationRoutes from './routes/allocationRoutes';
import goalRoutes from './routes/goalRoutes';
import kpiRoutes from './routes/kpiRoutes';
import clientRoutes from './routes/clientRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import walletRoutes from './routes/walletRoutes';
import simulationRoutes from './routes/simulationRoutes';
import projectionRoutes from './routes/projectionRoutes';
import insuranceRoutes from './routes/insuranceRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/data', dataRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/projections', projectionRoutes);
app.use('/api/insurance', insuranceRoutes);

app.all('*', (_, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;

