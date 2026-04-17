# Using Question Tags

## Basic Filtering
### Single Tag:
Find all questions tagged with "algebra". Simple one-to-one lookup using the question_tags association table.

### Tag Substring: 
Find all questions with tags containing "math" - captures "math", "mathematics", "math-101", etc. Uses pattern matching for flexibility.

### Multiple Tags
AND Logic (All Tags): Find questions tagged with BOTH "algebra" AND "easy". The question must have every tag you specify. Useful when you want questions matching multiple criteria simultaneously.

OR Logic (Any Tags): Find questions tagged with EITHER "algebra" OR "geometry". The question needs at least one of the tags you specify. Useful for broader searches.

### Complex Combinations
Mixed Logic: Find questions that are ("easy" OR "medium") AND "algebra". This lets you specify multiple conditions - some with AND logic, some with OR. For example, get medium-to-easy difficulty algebra questions.

## Grouping & Analytics
### Count Questions by Tag: 
See statistics like "algebra has 15 questions, geometry has 8, etc." Groups all questions and shows distribution across tags.

### Build Decks by Tags: 
Automatically populate a deck with questions matching specific tag criteria. Teachers can say "build me a practice deck with all easy or medium algebra questions" and the system adds matching questions automatically.

### Recommended Tag Organization  
#### Use a tiered approach:

##### Difficulty: 
- easy
- medium
- hard
##### Subject:
- algebra
- geometry
- calculus
##### Type: 
- practice
- exam
- homework
##### Chapter/Unit: 
- chapter-1
- chapter-2
- etc.  
  
  

This structure allows filtering like "give me all easy algebra chapter-2 practice questions"  
by combining multiple tag categories. A good use case would be in the creation of a deck,  
a tag user input field can be given multiple string tags and a search option will find all questions  
containing any/all of those tags.