import styles from "./questions.module.css";

export default function QuestionsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Teacher tools</p>
          <h1>Create Question Decks</h1>
          <p className={styles.subtitle}>
            Draft questions, set difficulty, and build answer options for each round.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} type="button">
            Save draft
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.formCard}>
          <h2>Question details</h2>
          <label className={styles.label} htmlFor="deck-name">
            Deck name
          </label>
          <input
            id="deck-name"
            className={styles.input}
            placeholder="e.g. Algebra II - Unit 3"
            type="text"
          />
          <label className={styles.label} htmlFor="question-text">
            Question prompt
          </label>
          <textarea
            id="question-text"
            className={styles.textarea}
            placeholder="Type the challenge question students will answer."
          />

          <div className={styles.row}>
            <div>
              <label className={styles.label} htmlFor="difficulty">
                Difficulty
              </label>
              <select id="difficulty" className={styles.input}>
                <option>Intro</option>
                <option>Core</option>
                <option>Challenge</option>
              </select>
            </div>
            <div>
              <label className={styles.label} htmlFor="timer">
                Timer (seconds)
              </label>
              <input
                id="timer"
                className={styles.input}
                placeholder="60"
                type="number"
              />
            </div>
          </div>
        </section>

        <section className={styles.formCard}>
          <h2>Answer options</h2>
          <div className={styles.optionList}>
            {[
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ].map((label, index) => (
              <div key={label} className={styles.optionRow}>
                <span className={styles.optionBadge}>{index + 1}</span>
                <input
                  className={styles.input}
                  placeholder={label}
                  type="text"
                />
                <label className={styles.checkLabel}>
                  <input type="checkbox" /> Correct
                </label>
              </div>
            ))}
          </div>
          <button className={styles.ghostBtn} type="button">
            Add another option
          </button>
        </section>
      </main>
    </div>
  );
}
