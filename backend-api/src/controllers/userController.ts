import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Request as ExpressRequest } from "express";

const prisma = new PrismaClient();

interface AuthRequest extends ExpressRequest {
  user?: { userId: string; isAdmin: boolean };
}

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({
          message: "Brak autoryzacji - użytkownik nie jest dostępny w żądaniu.",
        });
    }

    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Użytkownik nie znaleziony." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Błąd podczas pobierania profilu użytkownika:", error);
    res
      .status(500)
      .json({
        message:
          "Wystąpił błąd serwera podczas pobierania profilu użytkownika.",
      });
  }
};
