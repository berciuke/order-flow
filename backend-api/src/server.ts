import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health'; 
import authRouter from './routes/authRoutes'; 
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.use('/', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);


app.get('/', (req: Request, res: Response) => {
  res.send('OrderFlow Backend API działa!');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Nieobsługiwany błąd:', err.stack);
  res.status(500).json({ message: 'Wystąpił nieoczekiwany błąd serwera.', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
}); 