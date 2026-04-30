'use client';

import Link from "next/link";
import { logOut } from '@/app/auth';
import styles from "./student_home.module.css";
import UserName from "@/components/UserName";

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
        <div className={styles.navActions}>
          <button className={styles.primaryBtn} onClick={() => logOut()}>
                Log out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1>A new game awaits!</h1>
            <p>
              Join a game or study a question set to prep for the next one
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryBtn} href="/student_lobby">
                Join a match
              </a>
              <a className={styles.secondaryBtn} href="/student_study_session">
                Study a set
              </a>

            </div>
          </div>
          <div className={styles.card}>
            <h2>Recent Games</h2>
            <ul>
              <li>Physics - Momentum Surge (Focus 82)</li>
              <li>Algebra - Factor Frenzy (Focus 77)</li>
              <li>Biology - Cell Defense (Focus 91)</li>
            </ul>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3>Quick Actions</h3>
            <a className={styles.secondaryBtn} href = "/student_course_enrollments">
              Manage Courses
            </a>
            <a className={styles.secondaryBtn} href = "/student_view_saved">
              View saved sets
            </a>
            <a className={styles.secondaryBtn} href = "/student_save_set">
              Save a new set
            </a>
          </div>
          <div className={styles.panel}>
            <h3>Upcoming Sessions</h3>
            <li>Wednesday - 2:30 PM<br></br>
            Algebra II - Unit 3</li>
            <li>Friday - 1 PM<br></br>
            Psychology: Locations in the Brain</li>
          </div>
          <div className={styles.panel}>
            <h3>Focus Streaks</h3>
            <p>
              Your focus average per game is <strong>46 minutes</strong>. Next suggested break
              window is in 12 minutes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
