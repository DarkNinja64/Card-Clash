'use client';

import styles from "./teacher_login.module.css";
import { useState } from 'react';
import { teacherLogIn, teacherSignUp } from '@/app/auth';

export default function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Log in and sign up handling
  const handleSignIn = async () => {
    if (!email || !password) return setMessage('Please enter email and password');
    setLoading(true);
    const result = await teacherLogIn(email, password);
    if (result?.error) setMessage(result.error);
    setLoading(false);
  };

  const handleSignUp = async () => {
    if ( !email || !password) return setMessage('Please enter email and password');
    setLoading(true);
    const result = await teacherSignUp(email, password);
    if (result?.error) setMessage(result.error);
    else if (result?.message) setMessage(result.message);
    setLoading(false);
  };


  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.header}>
          <span className={styles.brandMark} />
          <div>
            <h1>Card Clash Login</h1>
            <p>Sign in to host a game or review class insights</p>
          </div>
        </div>

        <div className={styles.roleGrid}>
          <section className={styles.roleCard}>
            <h2>Teacher</h2>
            <label className={styles.label} htmlFor="teacher-email">
              Email
            </label>
            <input
              id="teacher-email"
              type="email"
              placeholder="myemail@school.edu"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <label className={styles.label} htmlFor="teacher-pass">
              Password
            </label>
            <input
              id="teacher-pass"
              type="password"
              placeholder="••••••••"
              className={styles.input}
              value={password}
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
                Create Teacher Account
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
