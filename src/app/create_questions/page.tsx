import styles from "./questions.module.css";
import { redirect } from 'next/navigation';
import { createQuestionCard } from './actions';
import { removeQuestionCard } from './actions';
import { createClient } from "@/lib/supabase/server";
import { fetchCategoriesForStudySession } from "../student_study_session/actions";
{/*This uses the old question creation system and does not use the new deck system. It will need to be changed once it is implemented*/}
export async function findQuestions(category : string){
  const supabase = await createClient();
  const { data: questions, error } = await supabase
    .from("question_card")
    .select("*")
    .eq("category", category);
    


  if (error) {
    console.error("Supabase fetch error:", error);
  }

  return questions;
}





export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const currentCategory = category || "";
  
  const questions = await findQuestions(currentCategory);

  const categories = await fetchCategoriesForStudySession();

  async function handleSearch(formData: FormData) {
    'use server';
    const newCat = formData.get('searchCategory');
    
    redirect(`?category=${newCat}`);
  }

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
        {/*where the category search function is*/}
        <section>
         <form action={handleSearch} className={styles.searchForm}> 
          <section className={styles.formCard}>
            <p>Search through existing categories.</p>
          <input 
            name="searchCategory" 
            placeholder="Search category..." 
            defaultValue={currentCategory}
            className={styles.input}
          />
          <button type="submit" className = {styles.ghostBtn}>Filter</button>
          {!categories?.length && (
            <p>No categories found.</p>
          )}
          {categories?.length > 0 && (
            <div>
              <p>Available categories: {categories.join(", ")}</p>
            </div>
          )}
          
        </section>
        </form>
        <form action = {removeQuestionCard}>
            {/*all the questions baby*/}
            <section className={styles.formCard}>
              <h2>Existing questions:</h2>
              <div className={styles.scrollContainer}>
                
                {!questions?.length && (
                  <p>No questions found in category "test1".</p>
                )}
                {questions?.map((q: any) => (
                  <article key={q.id} className={styles.questionRow}>
                    <h3>{q.question}</h3>
                    <div>Category: {q.category}</div>
                    <div>Difficulty: {q.difficulty}</div>
                    <div>Timer: {q.timer_seconds}s</div>
                    <ul>
                      {[q.answer_option_1, q.answer_option_2, q.answer_option_3, q.answer_option_4]
                        .filter(Boolean)
                        .map((opt, i) => (
                          <li key={i}>
                            {opt}
                            {q.correct_answer_option === String(i + 1) ? " ✓" : ""}
                          </li>
                        ))}
                    </ul>
                    <input type="hidden" name="question" value={q.question} />
  
                  <button type="submit" className={styles.primaryBtn}>
                      Delete
                  </button>
                  </article>

                ))}
              </div>
            </section>
            </form>
            </section>
        
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
                                  <input type="checkbox"
                                         name="correct_answer_option"
                                         value={index + 1}
                                  /> Correct

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
              </section>

      </form>


      </main>
    </div>

  );
}