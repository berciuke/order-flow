import prisma from '../utils/prismaClient';
import bcrypt from 'bcryptjs';
import { UserCreateInput } from '../types/userTypes'; 
export const createUser = async (userData: UserCreateInput) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    },
    select: { 
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  });
  
  return user;
}; 