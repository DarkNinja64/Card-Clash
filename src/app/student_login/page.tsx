'use client';

import styles from "./student_login.module.css";

import { useState } from 'react';
import { logIn, signUp } from '@/app/auth';

export default function LoginPage() {

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Log in and sign up handling
  const handleSignIn = async () => {
    if (!displayName || !password) return setMessage('Please enter username and password');
    setLoading(true);
    const result = await logIn(email, password);
    if (result?.error) setMessage(result.error);

    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!displayName || !password) return setMessage('Please enter username and password');
    setLoading(true);
    const result = await signUp(email, password);
    if (result?.error) setMessage(result.error);
    else if (result?.message) setMessage('Account Created! Login to play.');
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.header}>
          <span className={styles.brandMark} />
          <div>
            <h1>Card Clash Login</h1>
            <p>Sign in to join a game or study a set</p>
          </div>
        </div>

        <div className={styles.roleGrid}>
          <section className={styles.roleCard}>
            <h2>Student</h2>
            <label className={styles.label} htmlFor="student-name">
              Display name
            </label>
            <input
              id="student-name"
              type="text"
              placeholder="username"
              className={styles.input}
              value= {displayName}
              onChange={e => setDisplayName(e.target.value)}
            />

            <label className={styles.label} htmlFor="student-email">
              Email
            </label>
            <input
              id="student-email"
              type="email"
              placeholder="studentemail@school.edu"
              className={styles.input}
              value= {email}
              onChange={e => setEmail(e.target.value)}
            />

            <label className={styles.label} htmlFor="student-pass">
              Create password
            </label>
            <input
              id="student-pass"
              type="password"
              placeholder="••••••••"
              className={styles.input}
              value= {password}
              onChange={e => setPassword(e.target.value)}
            />
            <p style={{ color: 'red' }}>
              {message}
            </p>
            <div className={styles.actions}>
              <button
                className={styles.primaryBtn}
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </button>

              <button
                className={styles.ghostBtn}
                onClick={handleSignUp}
                disabled={loading}
              >
                Create Student Account
              </button>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
