import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.api';
import { AuthProvider } from '../context/AuthContext';
import { SignUpPage } from './SignUpPage';

vi.mock('../api/auth.api');

function renderSignUpPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SignUpPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('SignUpPage', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows inline validation errors and does not call the API for invalid input', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('unauthenticated'));
    const user = userEvent.setup();
    renderSignUpPage();

    await user.type(screen.getByLabelText('Name'), 'Jo');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'weakpassword');
    await user.type(screen.getByLabelText('Confirm password'), 'somethingelse');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Name must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(
      screen.getByText('Password must contain a letter, a number, and a special character'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(authApi.signUp).not.toHaveBeenCalled();
  });

  it('submits valid input to the API', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('unauthenticated'));
    vi.mocked(authApi.signUp).mockResolvedValue({
      id: '1',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
    const user = userEvent.setup();
    renderSignUpPage();

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'Str0ng!Pass');
    await user.type(screen.getByLabelText('Confirm password'), 'Str0ng!Pass');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() =>
      expect(authApi.signUp).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Str0ng!Pass',
      }),
    );
  });
});
