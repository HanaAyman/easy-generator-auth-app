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
import type { SignUpFormValues } from '../validation/auth.schemas';
import { signUpSchema } from '../validation/auth.schemas';
import styles from './AuthForm.module.css';

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpFormValues) {
    setApiError(null);
    try {
      await signUp(values);
      navigate('/', { replace: true });
    } catch (error) {
      setApiError(extractErrorMessage(error, 'Could not create your account. Try again.'));
    }
  }

  return (
    <AuthLayout title="Create your account">
      {apiError && <ErrorBanner message={apiError} />}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <SubmitButton isSubmitting={isSubmitting}>Sign up</SubmitButton>
      </form>
      <p className={styles.switchLink}>
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
