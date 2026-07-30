import type { ButtonHTMLAttributes } from 'react';
import styles from './SubmitButton.module.css';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting: boolean;
}

export function SubmitButton({ isSubmitting, children, disabled, ...rest }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={styles.button}
      disabled={disabled || isSubmitting}
      {...rest}
    >
      {isSubmitting ? 'Please wait…' : children}
    </button>
  );
}
