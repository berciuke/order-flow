import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Adres email musi być poprawnym adresem email.',
    'string.empty': 'Adres email jest wymagany.',
    'any.required': 'Adres email jest wymagany.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Hasło musi mieć co najmniej 6 znaków.',
    'string.empty': 'Hasło jest wymagane.',
    'any.required': 'Hasło jest wymagane.'
  })
}); 