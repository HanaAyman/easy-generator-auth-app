import type { ReactNode } from 'react';
import { EasygeneratorLogo } from './EasygeneratorLogo';
import styles from './AuthLayout.module.css';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.brandPanel}>
          <div className={styles.blobA} />
          <div className={styles.blobB} />
          <div className={styles.brandContent}>
            <div className={styles.logoBadge}>
              <EasygeneratorLogo className={styles.logo} />
            </div>
            <div>
              <h2 className={styles.tagline}>Turn your ideas into action.</h2>
              <p className={styles.subtagline}>
                Sign in to pick up right where you left off — creating training that actually
                lands.
              </p>
            </div>
          </div>
        </aside>
        <div className={styles.formPanel}>
          <div className={styles.formPanelInner}>
            <EasygeneratorLogo className={styles.mobileLogo} />
            <h1 className={styles.title}>{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
