import styles from "./teacher_login.module.css";

export default function LoginPage() {
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
              <a className={styles.primaryBtn} href="/teacher_home">
                Login
              </a>
              <a className={styles.ghostBtn} href="/teacher_home">
                Create Teacher Account
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
