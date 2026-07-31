// Runs before any test file is required, so these are already in
// process.env by the time app.module.ts (and its ConfigModule.forRoot()
// validation) is imported. Setting them later, e.g. in a beforeAll hook,
// is too late - the import happens first.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/auth-app-e2e-test';
process.env.JWT_SECRET = 'e2e-test-secret-value-at-least-32-chars-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
