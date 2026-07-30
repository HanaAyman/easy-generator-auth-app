import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/http-client';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';
import { useAuth } from '../context/useAuth';
import type { SignInFormValues } from '../validation/auth.schemas';
import { signInSchema } from '../validation/auth.schemas';
import styles from './AuthForm.module.css';

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInFormValues) {
    setApiError(null);
    try {
      await signIn(values);
      navigate('/', { replace: true });
    } catch (error) {
      setApiError(extractErrorMessage(error, 'Could not sign you in. Try again.'));
    }
  }

  return (
    <AuthLayout title="Sign in">
      {apiError && <ErrorBanner message={apiError} />}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <SubmitButton isSubmitting={isSubmitting}>Sign in</SubmitButton>
      </form>
      <p className={styles.switchLink}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
