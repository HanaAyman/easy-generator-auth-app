import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// ConfigModule.forRoot() validates and snapshots process.env as soon as
// app.module.ts is imported above - before this file's beforeAll runs - so
// overriding process.env afterwards has no effect on it. ConfigService is
// overridden below with a shim that reads process.env live instead, so the
// values set in beforeAll (a fresh in-memory Mongo URI, a test JWT secret,
// etc.) actually reach the app instead of the real values from .env.
class LiveEnvConfigService {
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const value = process.env[key];
    return value === undefined ? defaultValue : (value as unknown as T);
  }

  getOrThrow<T = string>(key: string): T {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value as unknown as T;
  }
}

describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  const credentials = {
    email: 'jane.doe@example.com',
    name: 'Jane Doe',
    password: 'Str0ng!Pass1',
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = 'e2e-test-secret-value-at-least-32-chars-long';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useClass(LiveEnvConfigService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('rejects signup with a password that fails the complexity policy', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ ...credentials, password: 'weakpassword' })
      .expect(400);
  });

  it('rejects signup with a name shorter than 3 characters', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ ...credentials, name: 'Jo' })
      .expect(400);
  });

  it('signs up a new user and sets an httpOnly session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(credentials)
      .expect(201);

    const body = res.body as {
      email: string;
      name: string;
      passwordHash?: string;
    };
    expect(body).toMatchObject({
      email: credentials.email,
      name: credentials.name,
    });
    expect(body.passwordHash).toBeUndefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie[0]).toMatch(/access_token=/);
    expect(setCookie[0]).toMatch(/HttpOnly/i);
  });

  it('rejects a duplicate signup with 409 Conflict', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(credentials)
      .expect(409);
  });

  it('rejects signin with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: credentials.email, password: 'WrongPassword1!' })
      .expect(401);
  });

  it('rejects /users/me without a session cookie', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('signs in and fetches the protected profile with the session cookie', async () => {
    const signInRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    const sessionCookie = signInRes.headers['set-cookie'];

    const meRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(meRes.body).toMatchObject({
      email: credentials.email,
      name: credentials.name,
    });
  });

  it('logs out and clears the session cookie', async () => {
    const signInRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const sessionCookie = signInRes.headers['set-cookie'];

    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(204);

    expect(logoutRes.headers['set-cookie'][0]).toMatch(/access_token=;/);
  });
});
