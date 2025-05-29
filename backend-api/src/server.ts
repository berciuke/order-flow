import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import healthRouter from './routes/health'; // Importuj router

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.use('/', healthRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 