import { Request, Response } from 'express';
import Joi from 'joi';
import * as userService from '../services/userService';
import { UserCreateInput } from '../types/userTypes';

const registerSchema = Joi.object<UserCreateInput>({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Błąd walidacji', details: error.details });
    }

    const newUser = await userService.createUser(value);
    
    res.status(201).json({ id: newUser.id, email: newUser.email });

  } catch (err: any) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'Użytkownik o podanym adresie email już istnieje.' });
    }
    console.error('Błąd podczas rejestracji:', err); 
    res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
  }
}; 