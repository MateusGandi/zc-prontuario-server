import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// ─── Chaves dos metadados ─────────────────────────────────────────────────────
export const IS_PUBLIC_KEY = 'isPublic';
export const IS_ADMIN_KEY = 'isAdmin';

// ─── Payload do token ─────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── Decorators ───────────────────────────────────────────────────────────────

/** Rota pública — nenhum token é exigido */
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Exige role = "admin" */
export const IsAdmin = () => SetMetadata(IS_ADMIN_KEY, true);

/**
 * Extrai o usuário autenticado do request.
 * @example @CurrentUser() user: TokenPayload
 * @example @CurrentUser('email') email: string
 */
export const CurrentUser = createParamDecorator(
  (field: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const user: TokenPayload = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field] : user;
  },
);

// ─── Guard JWT global ─────────────────────────────────────────────────────────

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    // 1. Rota pública → passa livre
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Extrai e valida o token Bearer
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token não informado');

    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // 3. Rota admin → exige role
    const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isAdmin && payload.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administradores');
    }

    // 4. Injeta o payload no request para uso via @CurrentUser
    (req as any).user = payload;
    return true;
  }
}
