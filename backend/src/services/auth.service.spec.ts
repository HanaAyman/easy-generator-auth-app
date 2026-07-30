import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const signUpDto = {
    email: 'jane.doe@example.com',
    name: 'Jane Doe',
    password: 'Str0ng!Pass1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByEmailWithPassword: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('signUp', () => {
    it('throws ConflictException when the email is already registered', async () => {
      usersService.findByEmail.mockResolvedValue({ _id: 'existing' } as any);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('hashes the password and creates the user when the email is free', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ _id: 'new-user' } as any);

      const user = await authService.signUp(signUpDto);

      expect(usersService.create).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.name,
        expect.any(String),
      );
      const storedHash = usersService.create.mock.calls[0][2];
      expect(storedHash).not.toBe(signUpDto.password);
      await expect(
        bcrypt.compare(signUpDto.password, storedHash),
      ).resolves.toBe(true);
      expect(user).toEqual({ _id: 'new-user' });
    });
  });

  describe('signIn', () => {
    it('throws UnauthorizedException when no user exists for the email', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.signIn({
          email: signUpDto.email,
          password: signUpDto.password,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const passwordHash = await bcrypt.hash('a-different-password1!', 12);
      usersService.findByEmailWithPassword.mockResolvedValue({
        _id: 'user-1',
        passwordHash,
      } as any);

      await expect(
        authService.signIn({
          email: signUpDto.email,
          password: signUpDto.password,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns the user when the password matches', async () => {
      const passwordHash = await bcrypt.hash(signUpDto.password, 12);
      const storedUser = {
        _id: 'user-1',
        email: signUpDto.email,
        passwordHash,
      };
      usersService.findByEmailWithPassword.mockResolvedValue(storedUser as any);

      const user = await authService.signIn({
        email: signUpDto.email,
        password: signUpDto.password,
      });

      expect(user).toBe(storedUser);
    });
  });

  describe('issueToken', () => {
    it('signs a payload containing the user id and email', () => {
      jwtService.sign.mockReturnValue('signed.jwt.token');

      const token = authService.issueToken({
        _id: { toString: () => 'user-1' },
        email: signUpDto.email,
      } as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: signUpDto.email,
      });
      expect(token).toBe('signed.jwt.token');
    });
  });
});
