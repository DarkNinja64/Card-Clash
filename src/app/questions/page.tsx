import styles from "./questions.module.css";
// At top of page.tsx
import { createQuestionCard } from './actions';



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

        </div>
      </header>

      <main className={styles.main}>
          <form action={createQuestionCard}>
        <section className={styles.formCard}>
          <h2>Question details</h2>
          <label className={styles.label} htmlFor="deck-name">
            Deck name
          </label>
          <input
            id="deck-name"
            name="category"
            className={styles.input}
            placeholder="e.g. Algebra II - Unit 3"
            type="text"
          />
          <label className={styles.label} htmlFor="question-text">
            Question prompt
          </label>
          <textarea
            id="question-text"
            name="question"
            className={styles.textarea}
            placeholder="Type the challenge question students will answer."
          />

          <div className={styles.row}>
            <div>
              <label className={styles.label} htmlFor="difficulty">
                Difficulty
              </label>
              <select id="difficulty" name="difficulty" className={styles.input}>
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
                name="timer_seconds"
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
                                  name={`answer_option_${index+1}`}
                                  className={styles.input}
                                  placeholder={label}
                                  type="text"
                              />
                              <label className={styles.checkLabel}>
                                  <input type="checkbox"/> Correct
                              </label>
                          </div>
                      ))}
                  </div>
                  <button className={styles.ghostBtn} type="button">
                      Add another option
                  </button>
              </section>

              <div className={styles.submitWrapper}>
                  <button type="submit" className={styles.primaryBtn}>
                      Submit
                  </button>
              </div>

      </form>


      </main>
    </div>

  );
}
