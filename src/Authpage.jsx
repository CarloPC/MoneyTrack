import { useState } from 'react';
import { useAuth } from './AuthContext';
import styles from './Auth.module.css';

export default function AuthPage() {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const res = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    if (res.error) setError(res.error);
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const res = await resetPassword(form.email);
    if (res.error) setError(res.error);
    else setResetSent(true);
    setLoading(false);
  };

  const goToReset = () => {
    setMode('forgot');
    setError('');
    setResetSent(false);
  };

  const backToLogin = () => {
    setMode('login');
    setError('');
    setResetSent(false);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.grid} />
      </div>

      <div className={styles.card + ' page-enter'}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>₱</span>
          <span className={styles.logoText}>Ipon<span>Track</span></span>
        </div>
        <p className={styles.tagline}>Track every peso. Own your future.</p>

       {mode !== 'forgot' && (
          <div className={styles.tabs}>
            <button className={mode === 'login' ? styles.tabActive : styles.tab} onClick={() => { setMode('login'); setError(''); }}>Login</button>
            <button className={mode === 'register' ? styles.tabActive : styles.tab} onClick={() => { setMode('register'); setError(''); }}>Register</button>
          </div>
        )}

        {mode === 'forgot' ? (
          resetSent ? (
            <div className={styles.resetSuccess}>
              <p>If an account exists for <strong>{form.email}</strong>, a password reset link is on its way. Check your inbox (and spam folder).</p>
              <button className={styles.backLink} onClick={backToLogin} type="button">Back to Sign In</button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleReset}>
              <p className={styles.tagline} style={{ marginBottom: 0 }}>Enter your email and we'll send you a reset link.</p>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email" placeholder="you@email.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? <span className={styles.spinner} /> : 'Send Reset Link'}
              </button>
              <button className={styles.backLink} onClick={backToLogin} type="button">Back to Sign In</button>
            </form>
          )
        ) : (
          <form className={styles.form} onSubmit={handle}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label>Full Name</label>
                <input
                  type="text" placeholder="e.g. Lenet Gwapa" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email" placeholder="you@email.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password" placeholder="••••••••" required minLength={6}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              />
              {mode === 'login' && (
                <button type="button" className={styles.forgotLink} onClick={goToReset}>Forgot password?</button>
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? <span className={styles.spinner} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}