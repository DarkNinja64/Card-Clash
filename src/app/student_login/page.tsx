import styles from "./student_login.module.css";

export default function LoginPage() {
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
            />
            <label className={styles.label} htmlFor="student-email">
              Email (optional)
            </label>
            <input
              id="student-email"
              type="email"
              placeholder="studentemail@school.edu"
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
                Login
              </a>
              <a className={styles.ghostBtn} href="/home">
                Create Student Account
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
