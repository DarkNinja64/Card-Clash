import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.header}>
          <span className={styles.brandMark} />
          <div>
            <h1>Card Clash Login</h1>
            <p>Sign in to continue to your chosen play mode.</p>
          </div>
        </div>

        <div className={styles.roleGrid}>
          <section className={styles.roleCard}>
            <h2>Student</h2>
            <p>Create a student profile or jump in with a name.</p>
            <label className={styles.label} htmlFor="student-name">
              Display name
            </label>
            <input
              id="student-name"
              type="text"
              placeholder="Your name"
              className={styles.input}
            />
            <label className={styles.label} htmlFor="student-email">
              Email (optional)
            </label>
            <input
              id="student-email"
              type="email"
              placeholder="student@school.edu"
              className={styles.input}
            />
            <label className={styles.label} htmlFor="student-pass">
              Create password
            </label>
            <input
              id="student-pass"
              type="password"
              placeholder="••••••••"
              className={styles.input}
            />
            <div className={styles.actions}>
              <a className={styles.primaryBtn} href="/home">
                Continue
              </a>
              <a className={styles.ghostBtn} href="/home">
                Create student account
              </a>
            </div>
          </section>

          <section className={styles.roleCard}>
            <h2>Teacher</h2>
            <p>Sign in to host a game or review class insights.</p>
            <label className={styles.label} htmlFor="teacher-email">
              Email
            </label>
            <input
              id="teacher-email"
              type="email"
              placeholder="you@school.edu"
              className={styles.input}
            />
            <label className={styles.label} htmlFor="teacher-pass">
              Password
            </label>
            <input
              id="teacher-pass"
              type="password"
              placeholder="••••••••"
              className={styles.input}
            />
            <div className={styles.actions}>
              <a className={styles.primaryBtn} href="/home">
                Sign in
              </a>
              <a className={styles.ghostBtn} href="/home">
                Create account
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
