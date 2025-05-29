import { Response } from 'express';
import { PrismaClient, OrderStatus, Prisma } from '@prisma/client';
import { createOrderSchema } from '../validators/orderValidator';
import { Request as ExpressRequest } from 'express';

const prisma = new PrismaClient();

interface AuthRequest extends ExpressRequest {
  user?: { userId: string; isAdmin: boolean };
}

// POST /api/orders - Tworzenie zamówienia
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Musisz być zalogowany, aby złożyć zamówienie.' });
    }
    const userId = req.user.userId;

    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Błąd walidacji', details: error.details.map(d => d.message) });
    }

    const { items } = value; // items: [{ productId, quantity }]

    let totalAmount = 0;
    const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ message: `Produkt o ID ${item.productId} nie został znaleziony.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Niewystarczająca ilość produktu ${product.name} na stanie. Dostępne: ${product.stock}, zamówiono: ${item.quantity}.` });
      }
      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        quantity: item.quantity,
        price: product.price, 
        product: { 
          connect: { id: item.productId }
        }
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true }, 
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return newOrder;
    });

    res.status(201).json(order);

  } catch (error) {
    console.error('Błąd podczas tworzenia zamówienia:', error);
    // tu by można było dodać szczegółową obsługę błędów, ale to nie jest przedmiot backend development :-)
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas tworzenia zamówienia.' });
  }
};

// GET /api/orders - Lista zamówień użytkownika
export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Musisz być zalogowany, aby zobaczyć swoje zamówienia.' });
    }
    const userId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true } 
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Błąd podczas pobierania zamówień użytkownika:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas pobierania zamówień.' });
  }
};

// GET /api/orders/:id - Szczegóły konkretnego zamówienia
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Musisz być zalogowany, aby zobaczyć szczegóły zamówienia.' });
    }
    const userId = req.user.userId;
    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, description: true, price: true }
            }
          }
        },
        user: {
            select: { id: true, name: true, email: true }
        }
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Zamówienie nie znalezione.' });
    }

    if (order.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Nie masz uprawnień, aby wyświetlić to zamówienie.' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Błąd podczas pobierania szczegółów zamówienia:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas pobierania szczegółów zamówienia.' });
  }
}; 