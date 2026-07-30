import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SignUpDto } from '../dtos/sign-up.dto';
import { SignInDto } from '../dtos/sign-in.dto';
import { UserDocument } from '../entities/user.schema';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from './users.service';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto): Promise<UserDocument> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      this.logger.warn(
        `Signup rejected, email already registered: ${dto.email}`,
      );
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create(
      dto.email,
      dto.name,
      passwordHash,
    );
    this.logger.log(`User signed up: ${user._id.toString()}`);
    return user;
  }

  async signIn(dto: SignInDto): Promise<UserDocument> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      this.logger.warn(`Signin failed, no such user: ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      this.logger.warn(
        `Signin failed, bad password for user: ${user._id.toString()}`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User signed in: ${user._id.toString()}`);
    return user;
  }

  issueToken(user: UserDocument): string {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    return this.jwtService.sign(payload);
  }
}
