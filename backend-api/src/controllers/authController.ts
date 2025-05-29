import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { loginSchema } from '../validators/authValidator';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sekretny-klucz-dla-tokenow'; 

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik o takim emailu już istnieje.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
      email,
      password: hashedPassword,
      name: name || 'Użytkownik bez nazwy',
      ...(email === "admin@example.com" ? { isAdmin: true } : {})
      },
    });

    res.status(201).json({ message: 'Użytkownik zarejestrowany pomyślnie.', userId: user.id });
  } catch (error) {
    console.error('Błąd podczas rejestracji:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas rejestracji.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Błąd walidacji', details: error.details.map(d => d.message) });
    }

    const { email, password } = value;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło.' });
    }

    const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, userId: user.id, isAdmin: user.isAdmin });

  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas logowania.' });
  }
}; 