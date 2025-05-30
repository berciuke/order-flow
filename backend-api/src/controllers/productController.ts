import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator";

const prisma = new PrismaClient();

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error) {
    console.error("Błąd podczas pobierania produktów:", error);
    res
      .status(500)
      .json({ message: "Wystąpił błąd serwera podczas pobierania produktów." });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Produkt nie znaleziony." });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Błąd podczas pobierania produktu:", error);
    res
      .status(500)
      .json({ message: "Wystąpił błąd serwera podczas pobierania produktu." });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({
          message: "Błąd walidacji",
          details: error.details.map((d) => d.message),
        });
    }

    const product = await prisma.product.create({
      data: value,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error("Błąd podczas tworzenia produktu:", error);
    res
      .status(500)
      .json({ message: "Wystąpił błąd serwera podczas tworzenia produktu." });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updateProductSchema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json({
          message: "Błąd walidacji",
          details: error.details.map((d) => d.message),
        });
    }

    const product = await prisma.product.update({
      where: { id },
      data: value,
    });
    res.status(200).json(product);
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error code for record not found
      return res.status(404).json({ message: "Produkt nie znaleziony." });
    }
    console.error("Błąd podczas aktualizacji produktu:", error);
    res
      .status(500)
      .json({
        message: "Wystąpił błąd serwera podczas aktualizacji produktu.",
      });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.status(204).send(); // No content
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error code for record not found
      return res.status(404).json({ message: "Produkt nie znaleziony." });
    }
    console.error("Błąd podczas usuwania produktu:", error);
    res
      .status(500)
      .json({ message: "Wystąpił błąd serwera podczas usuwania produktu." });
  }
};
