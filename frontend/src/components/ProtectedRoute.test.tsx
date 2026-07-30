import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.api';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../api/auth.api');

function renderProtectedApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<div>Sign in page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to /signin when there is no active session', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('unauthenticated'));

    renderProtectedApp();

    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
  });

  it('renders the protected content when a session exists', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue({
      id: '1',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });

    renderProtectedApp();

    expect(await screen.findByText('Secret content')).toBeInTheDocument();
  });
});
