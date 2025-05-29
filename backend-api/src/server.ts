import express, { Express } from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health'; 
import authRouter from './routes/authRoutes'; 

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.use('/', healthRouter);
app.use('/api/auth', authRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 