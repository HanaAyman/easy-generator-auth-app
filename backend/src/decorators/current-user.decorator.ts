import {
  createParamDecorator,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserDocument } from '../entities/user.schema';

const logger = new Logger('CurrentUserDecorator');

type RequestWithUser = Request & { user?: UserDocument };

/**
 * Reads the authenticated user off the request. Relies on JwtAuthGuard having
 * already run passport's JwtStrategy, which verifies the cookie-borne token
 * and attaches the resolved user document to `request.user`. Throws instead of
 * returning undefined so callers never have to null-check on top of the guard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      logger.warn(
        'CurrentUser decorator used without an authenticated request.user',
      );
      throw new UnauthorizedException();
    }
    return user;
  },
);
