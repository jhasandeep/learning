# Prompt for writing more assessment questions

The multiple-choice sets in `src/data/assess` follow the schema below, so JSON written to this
prompt can be added with little change (the app keeps the right answer in `correct` and the
four choices in `options`).

Create assessment questions for the role: {{ROLE}}.

- Section: {{MERN Stack MCQ | Aptitude MCQ | Coding Assessment}}
- Topics: {{TOPICS}}
- Difficulty: {{easy | medium | hard}} (mid-level = 2 to 4 years of experience)
- Number of questions: {{N}}
- Question type: {{mcq | coding}}

MCQ rules: one concept per question; exactly 4 options with one correct answer; plausible distractors
based on common misconceptions; prefer scenarios and code-output questions; spread the correct answer
evenly across A to D; no "all/none of the above"; the longest option is not the answer; a 1 to 2 sentence
explanation; accurate for Node 20+, React 18+, MongoDB 7+; no duplicates or copied questions.

Coding rules: clear statement, input and output format, constraints and 2 to 3 examples; solvable in
30 to 40 minutes; at least 5 tests (2 visible and 3 or more hidden edge cases); a reference solution with
complexity; starter code with the signature only; prefer practical backend tasks.

Before answering, check that every code output is correct and every reference solution passes its tests.
