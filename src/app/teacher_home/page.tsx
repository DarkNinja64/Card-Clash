'use client';

import styles from "./teacher_home.module.css";
import UserName from "@/components/UserName";
import { logOut } from '@/app/auth';

export default function PostLoginHome() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Welcome back, <UserName/></p>
          </div>
        </div>
        <button className={styles.primaryBtnBtn} onClick={() => logOut()}>
                Log out
          </button>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1>Ready to host a game?</h1>
            <p>
              Host a game or create a card set to help your students 
              study the content.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryBtn} href="/lobby">
                Host a match
              </a>
              <a className={styles.secondaryBtn} href="/questions">
                View question sets
              </a>
            </div>
          </div>
          <div className={styles.card}>
            <h2>Recent game sessions</h2>
            <ul>
              <li>Physics - Momentum Surge </li>
              <li>Algebra - Factor Frenzy </li>
              <li>Biology - Cell Defense </li>
            </ul>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3>Quick Actions</h3>
            <button className={styles.ghostBtn} type="button">
              View game results
            </button>
            <button className={styles.ghostBtn} type="button">
              Generate student summary
            </button>
            <button className={styles.ghostBtn} type="button">
              Share a question set
            </button>
          </div>
          <div className={styles.panel}>
            <h3>Previous Game Summary</h3>
            <p>
              <strong>Physics - Momentum Surge:</strong><br></br>
              The average score was <strong>89%</strong>. That is up from
              the last game by 17%! 12 out of 20 that played scored a 90% or higher!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
