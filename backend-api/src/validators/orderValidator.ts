import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required().messages({
        'string.empty': 'ID produktu jest wymagane w pozycji zamówienia.',
        'any.required': 'ID produktu jest wymagane w pozycji zamówienia.'
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        'number.base': 'Ilość musi być liczbą całkowitą.',
        'number.integer': 'Ilość musi być liczbą całkowitą.',
        'number.min': 'Ilość musi być co najmniej 1.',
        'any.required': 'Ilość jest wymagana w pozycji zamówienia.'
      })
    })
  ).min(1).required().messages({
    'array.min': 'Zamówienie musi zawierać co najmniej jeden produkt.',
    'any.required': 'Lista produktów jest wymagana do złożenia zamówienia.'
  })
}); 