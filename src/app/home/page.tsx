import styles from "./home.module.css";

export default function PostLoginHome() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Welcome back, Player One</p>
          </div>
        </div>
        <div className={styles.navActions}>
          <a className={styles.primaryBtn} href="/">
            Log out
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1>Your next session is ready.</h1>
            <p>
              Choose how you want to play, or review your recent activity and focus
              insights.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryBtn} href="/lobby">
                Host a match
              </a>
              <a className={styles.secondaryBtn} href="/game">
                Start solo study
              </a>
            </div>
          </div>
          <div className={styles.card}>
            <h2>Recent activity</h2>
            <ul>
              <li>Physics - Momentum Surge (Focus 82)</li>
              <li>Algebra - Factor Frenzy (Focus 77)</li>
              <li>Biology - Cell Defense (Focus 91)</li>
            </ul>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3>Quick actions</h3>
            <button className={styles.ghostBtn} type="button">
              Create a new deck
            </button>
            <button className={styles.ghostBtn} type="button">
              Review class insights
            </button>
            <button className={styles.ghostBtn} type="button">
              Invite students
            </button>
          </div>
          <div className={styles.panel}>
            <h3>Focus streaks</h3>
            <p>
              Your class focus average is <strong>84</strong>. Next suggested break
              window is in 12 minutes.
            </p>
          </div>
          <div className={styles.panel}>
            <h3>Upcoming session</h3>
            <p>Wednesday - 2:30 PM</p>
            <p>Deck: Algebra II - Unit 3</p>
          </div>
        </section>
      </main>
    </div>
  );
}
