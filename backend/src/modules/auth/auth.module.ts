import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  Body,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { isValidCpf } from '../../domain/rules';
import { AuthGuard, OptionalAuthGuard } from '../../common/guards/auth.guard';

const JWT_SECRET =
  process.env.JWT_SECRET || 'development-only-secret-change-me';

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.***-**';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() cpf!: string;
  @IsString() @Length(8, 128) password!: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() displayName?: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

@Injectable()
class AuthService {
  constructor(private db: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const cpf = dto.cpf.replace(/\D/g, '');
    const role = dto.role === 'producer' ? 'producer' : 'consumer';

    if (!isValidCpf(cpf)) {
      throw new BadRequestException(
        'CPF inválido. Informe um CPF válido de 11 dígitos.'
      );
    }

    const cpfHash = createHash('sha256').update(cpf).digest('hex');
    const existing = await this.db.user.findFirst({
      where: {
        OR: [{ email }, { cpfHash }],
      },
    });
    if (existing) {
      throw new ConflictException(
        'Email ou CPF já cadastrado neste ambiente.'
      );
    }

    const user = await this.db.user.create({
      data: {
        email,
        cpfHash,
        maskedCpf: maskCpf(cpf),
        passwordHash: await bcrypt.hash(dto.password, 10),
        role,
      },
    });

    if (role === 'producer' && dto.displayName?.trim()) {
      await this.db.producer.updateMany({
        where: { id: 'sitio-verde' },
        data: { displayName: dto.displayName.trim() },
      });
    }

    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const rawEmail = dto.email.trim().toLowerCase();
    const isDemoConsumer =
      rawEmail === 'jornada@mana.local' ||
      rawEmail === 'consumidor@mana.local';

    let user = await this.db.user.findFirst({
      where: isDemoConsumer
        ? {
            OR: [
              { id: 'mock-consumer' },
              { email: 'consumidor@mana.local' },
              { email: 'jornada@mana.local' },
            ],
          }
        : { email: rawEmail },
    });

    if (!user && dto.password === 'mana123') {
      const demoDefaults: Record<
        string,
        { id: string; email: string; cpf: string; maskedCpf: string; role: string }
      > = {
        'jornada@mana.local': {
          id: 'mock-consumer',
          email: 'jornada@mana.local',
          cpf: '52998224725',
          maskedCpf: '***.982.247-25',
          role: 'consumer',
        },
        'consumidor@mana.local': {
          id: 'mock-consumer',
          email: 'consumidor@mana.local',
          cpf: '52998224725',
          maskedCpf: '***.982.247-25',
          role: 'consumer',
        },
        'produtor@mana.local': {
          id: 'user-producer',
          email: 'produtor@mana.local',
          cpf: '12345678909',
          maskedCpf: '***.482.299-26',
          role: 'producer',
        },
        'operacoes@mana.local': {
          id: 'user-ops',
          email: 'operacoes@mana.local',
          cpf: '98765432100',
          maskedCpf: '***.550.250-97',
          role: 'operations',
        },
      };
      const demo = demoDefaults[rawEmail];
      if (demo) {
        user = await this.db.user.upsert({
          where: { id: demo.id },
          update: { role: demo.role },
          create: {
            id: demo.id,
            email: demo.email,
            cpfHash: createHash('sha256').update(demo.cpf).digest('hex'),
            maskedCpf: demo.maskedCpf,
            passwordHash: await bcrypt.hash('mana123', 10),
            role: demo.role,
          },
        });
      }
    }

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new BadRequestException(
        'Credenciais inválidas. Use a conta de demonstração ou uma conta cadastrada.'
      );
    }
    return this.issue(user);
  }

  private issue(user: { id: string; email: string; role: string }) {
    return {
      accessToken: jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
      ),
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}

@Controller('auth')
class AuthController {
  constructor(private service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Get('config')
  config() {
    return {
      sessionInactivityHours: 2,
      supportedRoles: ['consumer', 'producer', 'operations'],
    };
  }
}

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OptionalAuthGuard],
  exports: [AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
