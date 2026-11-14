import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'development-only-secret-change-me';

const DEV_MOCK_TOKENS: Record<
  string,
  { sub: string; email: string; role: string }
> = {
  'mock-local-session-mock-consumer': {
    sub: 'mock-consumer',
    email: 'consumidor@mana.local',
    role: 'consumer',
  },
  'mock-local-session-sitio-verde': {
    sub: 'user-producer',
    email: 'produtor@mana.local',
    role: 'producer',
  },
  'mock-local-session-ops-central': {
    sub: 'user-ops',
    email: 'operacoes@mana.local',
    role: 'operations',
  },
};

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedException('Token Bearer obrigatório');
    const rawToken = header.slice(7);
    if (process.env.NODE_ENV !== 'production' && DEV_MOCK_TOKENS[rawToken]) {
      req.user = DEV_MOCK_TOKENS[rawToken];
      return true;
    }
    try {
      req.user = jwt.verify(rawToken, JWT_SECRET) as {
        sub: string;
        email: string;
        role: string;
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const rawToken = header.slice(7);
      if (process.env.NODE_ENV !== 'production' && DEV_MOCK_TOKENS[rawToken]) {
        req.user = DEV_MOCK_TOKENS[rawToken];
        return true;
      }
      try {
        req.user = jwt.verify(rawToken, JWT_SECRET) as {
          sub: string;
          email: string;
          role: string;
        };
        return true;
      } catch {
        // Fallback to default consumer in demo mode
      }
    }
    req.user = {
      sub: 'mock-consumer',
      email: 'consumidor@mana.local',
      role: 'consumer',
    };
    return true;
  }
}
