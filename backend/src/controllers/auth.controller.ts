import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { SignUpDto } from '../dtos/sign-up.dto';
import { SignInDto } from '../dtos/sign-in.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import type { UserDocument } from '../entities/user.schema';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { parseDurationToMs } from '../utils/parse-duration.util';

const ACCESS_TOKEN_COOKIE = 'access_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new account and start a session' })
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signUp(dto);
    this.attachAuthCookie(res, user);
    return UserResponseDto.fromDocument(user);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate and start a session' })
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signIn(dto);
    this.attachAuthCookie(res, user);
    return UserResponseDto.fromDocument(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End the current session' })
  logout(
    @CurrentUser() _user: UserDocument,
    @Res({ passthrough: true }) res: Response,
  ): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  }

  private attachAuthCookie(res: Response, user: UserDocument): void {
    const token = this.authService.issueToken(user);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: parseDurationToMs(expiresIn),
      path: '/',
    });
  }
}
