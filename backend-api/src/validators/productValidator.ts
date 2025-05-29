import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Nazwa produktu jest wymagana.',
    'any.required': 'Nazwa produktu jest wymagana.'
  }),
  description: Joi.string().optional().allow(''), 
  price: Joi.number().positive().required().messages({
    'number.base': 'Cena musi być liczbą.',
    'number.positive': 'Cena musi być liczbą dodatnią.',
    'any.required': 'Cena jest wymagana.'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stan magazynowy musi być liczbą całkowitą.',
    'number.integer': 'Stan magazynowy musi być liczbą całkowitą.',
    'number.min': 'Stan magazynowy nie może być ujemny.',
    'any.required': 'Stan magazynowy jest wymagany.'
  })
});

export const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).optional()
}).min(1).messages({
  'object.min': 'Przynajmniej jedno pole musi być zaktualizowane.'
}); 