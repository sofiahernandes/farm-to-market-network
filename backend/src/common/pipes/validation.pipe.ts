import { ValidationPipe } from '@nestjs/common';

export const appValidationPipe = new ValidationPipe({
  whitelist: false,
  transform: true,
  forbidNonWhitelisted: false,
  errorHttpStatusCode: 422,
});
