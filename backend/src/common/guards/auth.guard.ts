import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Token Bearer obrigatório');
    try {
      req.user = this.jwt.verify<{ sub: string; email: string; role: string }>(
        header.slice(7)
      );
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
