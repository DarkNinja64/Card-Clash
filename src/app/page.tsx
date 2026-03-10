import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Classroom battle arena</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1>Competitive learning, built for the classroom.</h1>
            <p>
              Card Clash is a party-style educational game where students answer
              questions, play power cards, and build focus streaks together. Teachers
              get real-time insights and AI summaries to guide instruction.
            </p>
          </div>
          <div className={styles.summaryCard}>
            <h2>What it delivers</h2>
            <ul>
              <li>Real-time multiplayer game flow</li>
              <li>Focus tracking and attention trends</li>
              <li>AI-generated performance summaries</li>
              <li>Gamified rewards for participation</li>
            </ul>
          </div>
        </section>

        <section className={styles.modeCard}>
          <div>
            <h2>Sign In as Teacher or Student</h2>
            <p>
              Login is required before joining a lobby or starting solo study.
            </p>
          </div>
          <div className={styles.modeGrid}>
            <div className={styles.modeOption}>
              <strong>Student Sign In</strong>
              <span>Join a game or study questions sets</span>
              <a className={styles.secondaryBtn} href="/student_login">
                Login as Student
              </a>
            </div>
            <div className={styles.modeOption}>
              <strong>Teacher Sign In</strong>
              <span>Start live matches and create question sets</span>
              <a className={styles.secondaryBtn} href="/teacher_login">
                Login as Teacher
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
