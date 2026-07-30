import { useState } from 'react';
import { EasygeneratorLogo } from '../components/EasygeneratorLogo';
import { useAuth } from '../context/useAuth';
import styles from './WelcomePage.module.css';

export function WelcomePage() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <EasygeneratorLogo className={styles.logo} />
        <h1 className={styles.heading}>Welcome to the application.</h1>
        {user && <p className={styles.greeting}>Signed in as {user.name}</p>}
        <button className={styles.logoutButton} onClick={handleLogout} disabled={isSigningOut}>
          {isSigningOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
