import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Swapneri Boutique Backend API',
    endpoints: {
      health: '/api/health',
      orders: '/api/orders',
      customers: '/api/customers',
      payments: '/api/payments',
      expenses: '/api/expenses',
      measurements: '/api/measurements',
      shop: '/api/shop',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Swapneri Backend API is running on http://localhost:${PORT}`);
});

export default app;

