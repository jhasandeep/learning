import type { LearnTrack } from './types'

// Checks see `lines`: the commands typed, one per line (comments dropped).
const at = (re: string) => `lines.findIndex((l) => /${re.replace(/(?<!\\)\//g, '\\/')}/.test(l))`

export const git: LearnTrack = {
  id: 'git',
  intro: 'Type the commands for real Git workflows: first commits, staging, branches, safe undo, amend, stash, rebasing a branch and untracking secrets.',
  kind: 'text',
  lang: 'text',
  steps: [
    {
      id: 'first-commit',
      title: 'Your first commit',
      learn: `A Git repository records snapshots called **commits**:

- \`git init\` creates the repository
- \`git add <files>\` stages changes for the next commit (\`git add .\` stages everything here)
- \`git commit -m "message"\` saves the staged snapshot

Write one command per line.`,
      task: 'Create a repository, stage everything, and commit with the message "Initial commit".',
      starter: `# one command per line
`,
      solution: `git init
git add .
git commit -m "Initial commit"
`,
      tests: [
        ['starts with git init', `expect(${at('^git init\\b')}).toBe(0)`],
        ['stages the files', `expect(${at('^git add (\\.|-A|--all)$')}).toBeGreaterThan(0)`],
        ['commits with the message "Initial commit"', `const i = ${at('^git commit -m ["\']Initial commit["\']$')}; expect(i).toBeGreaterThan(${at('^git add ')})`],
      ],
      hints: ['Three commands: init, add, commit.', '`git commit -m "Initial commit"`.'],
    },
    {
      id: 'staging',
      title: 'Commit only what you mean',
      learn: `The **staging area** lets you commit part of your work. \`git status\` shows what changed; stage just one file with \`git add path\`.

Good messages say what the change does: \`fix: handle empty cart\`.`,
      task: 'You edited `src/cart.js` and `notes.txt`. Check the status, stage only `src/cart.js`, and commit it with the message "fix: handle empty cart".',
      starter: `git add .
git commit -m "stuff"
`,
      solution: `git status
git add src/cart.js
git commit -m "fix: handle empty cart"
`,
      tests: [
        ['looks at git status first', `expect(${at('^git status')}).toBe(0)`],
        ['stages only src/cart.js', `expect(lines.filter((l) => /^git add /.test(l))).toEqual(["git add src/cart.js"])`],
        ['commits with the right message', `expect(${at('^git commit -m ["\']fix: handle empty cart["\']$')}).toBeGreaterThan(${at('^git add src/cart\\.js')})`],
      ],
      hints: ['`git add .` would also stage notes.txt.', '`git add src/cart.js`, then commit with `-m`.'],
    },
    {
      id: 'branches',
      title: 'Feature branches',
      learn: `Work on a **branch** so \`main\` stays releasable:

- \`git switch -c feature/login\` creates a branch and switches to it
- commit as usual
- \`git push -u origin feature/login\` publishes it and sets the upstream, so later \`git push\` needs no arguments`,
      task: 'From `main`: pull the latest, create and switch to `feature/login`, stage everything and commit "feat: login form", then push the new branch and set its upstream.',
      starter: `git commit -m "feat: login form"
git push
`,
      solution: `git switch main
git pull
git switch -c feature/login
git add .
git commit -m "feat: login form"
git push -u origin feature/login
`,
      tests: [
        ['pulls main first', `expect(${at('^git pull')}).toBeGreaterThanOrEqual(0); expect(${at('^git pull')}).toBeLessThan(${at('^git (switch -c|checkout -b) feature\\/login$')})`],
        ['creates and switches to feature/login', `expect(${at('^git (switch -c|checkout -b) feature\\/login$')}).toBeGreaterThanOrEqual(0)`],
        ['commits on the branch', `expect(${at('^git commit -m ["\']feat: login form["\']$')}).toBeGreaterThan(${at('^git (switch -c|checkout -b) feature\\/login$')})`],
        ['pushes with -u origin feature/login', `expect(${at('^git push (-u|--set-upstream) origin feature\\/login$')}).toBe(lines.length - 1)`],
      ],
      hints: ['`git switch -c feature/login` (or `git checkout -b`).', 'Finish with `git push -u origin feature/login`.'],
    },
    {
      id: 'revert',
      title: 'Undo a pushed commit',
      learn: `Once a commit is shared, **don't rewrite history** (no \`reset\` + force-push): everyone else's copies would break.

\`git revert <sha>\` adds a **new** commit that undoes the old one. Find the sha with \`git log --oneline\`.`,
      task: 'Commit `a1b2c3d` on the shared `main` broke the build. Look at the log, revert that commit, and push.',
      starter: `git reset --hard HEAD~1
git push --force
`,
      solution: `git log --oneline
git revert a1b2c3d
git push
`,
      tests: [
        ['checks the log', `expect(${at('^git log')}).toBe(0)`],
        ['reverts a1b2c3d', `expect(${at('^git revert a1b2c3d$')}).toBeGreaterThan(0)`],
        ['pushes normally (no force)', `expect(lines.at(-1)).toBe("git push"); expect(text).not.toMatch(/--force|reset --hard/)`],
      ],
      hints: ['`git revert a1b2c3d` makes a new commit.', 'A plain `git push` is enough: history only grew.'],
    },
    {
      id: 'amend',
      title: 'Fix the last commit (before pushing)',
      learn: `Forgot a file, or made a typo in the message? If you haven't pushed yet, \`git commit --amend\` replaces the last commit:

\`\`\`
git add forgotten.js
git commit --amend -m "Better message"
\`\`\`

\`--no-edit\` keeps the old message. Never amend commits others already have.`,
      task: 'You just committed "Add serach" (not pushed) and forgot `src/search.css`. Stage the file and amend the commit with the message "Add search".',
      starter: `git commit -m "Add search"
`,
      solution: `git add src/search.css
git commit --amend -m "Add search"
`,
      tests: [
        ['stages the forgotten file', `expect(${at('^git add src\\/search\\.css$')}).toBe(0)`],
        ['amends with the fixed message', `expect(${at('^git commit --amend -m ["\']Add search["\']$')}).toBe(1)`],
      ],
      hints: ['Stage the file first.', '`git commit --amend -m "Add search"`.'],
    },
    {
      id: 'stash',
      title: 'Stash work in progress',
      learn: `Need to switch branches with half-finished work? \`git stash\` shelves it; \`git stash pop\` brings it back.

Plain \`git stash\` skips **untracked** (new) files; add \`-u\` to include them.`,
      task: 'You have half-done changes, including a new file. Stash everything (including untracked files), switch to `main` and pull, then switch back to `feature/search` and restore your work.',
      starter: `git switch main
`,
      solution: `git stash -u
git switch main
git pull
git switch feature/search
git stash pop
`,
      tests: [
        ['stashes including untracked files', `expect(${at('^git stash (-u|--include-untracked)$')}).toBe(0)`],
        ['updates main', `expect(${at('^git (switch|checkout) main$')}).toBeGreaterThan(0); expect(${at('^git pull')}).toBeGreaterThan(${at('^git (switch|checkout) main$')})`],
        ['goes back and restores the work', `expect(${at('^git (switch|checkout) feature\\/search$')}).toBeGreaterThan(${at('^git pull')}); expect(lines.at(-1)).toMatch(/^git stash (pop|apply)$/)`],
      ],
      hints: ['`git stash -u` includes new files.', 'End with `git stash pop` on your branch.'],
    },
    {
      id: 'rebase',
      title: 'Update your branch',
      learn: `\`main\` moved on while you worked. To replay your commits on top of the latest \`main\`:

\`\`\`
git fetch origin
git rebase origin/main
\`\`\`

Rebasing rewrites your branch's commits, so pushing needs force. Use \`--force-with-lease\`: it refuses if someone else pushed in the meantime (plain \`--force\` would erase their work).`,
      task: 'On `feature/cart` (already pushed, only you work on it): fetch, rebase onto `origin/main`, and push safely.',
      starter: `git pull
git push --force
`,
      solution: `git fetch origin
git rebase origin/main
git push --force-with-lease
`,
      tests: [
        ['fetches first', `expect(${at('^git fetch')}).toBe(0)`],
        ['rebases onto origin/main', `expect(${at('^git rebase origin\\/main$')}).toBe(1)`],
        ['pushes with --force-with-lease, not --force', `expect(lines.at(-1)).toMatch(/^git push --force-with-lease/); expect(lines.some((l) => /--force(\\s|$)/.test(l))).toBe(false)`],
      ],
      hints: ['`git fetch origin`, then `git rebase origin/main`.', '`git push --force-with-lease`.'],
    },
    {
      id: 'untrack-secrets',
      title: 'Stop tracking a secret file',
      learn: `\`.gitignore\` only affects files Git isn't tracking yet. If \`.env\` is already committed, remove it from the index (keeping your local copy) with \`git rm --cached .env\`, then commit.

The secret is still in history: **rotate it**.`,
      task: '`.env` was committed by mistake. Add it to `.gitignore` (`echo ".env" >> .gitignore`), untrack it without deleting your local file, stage `.gitignore`, and commit "chore: stop tracking .env".',
      starter: `echo ".env" >> .gitignore
git commit -m "chore: stop tracking .env"
`,
      solution: `echo ".env" >> .gitignore
git rm --cached .env
git add .gitignore
git commit -m "chore: stop tracking .env"
`,
      tests: [
        ['adds .env to .gitignore', `expect(${at('^echo ["\']?\\.env["\']? >> \\.gitignore$')}).toBeGreaterThanOrEqual(0)`],
        ['untracks .env but keeps the file', `expect(${at('^git rm --cached \\.env$')}).toBeGreaterThanOrEqual(0); expect(text).not.toMatch(/^git rm \\.env$/m)`],
        ['stages .gitignore and commits', `expect(${at('^git add \\.gitignore$')}).toBeGreaterThan(-1); expect(lines.at(-1)).toMatch(/^git commit -m ["']chore: stop tracking \\.env["']$/)`],
      ],
      hints: ['`git rm --cached .env` removes it from Git only.', 'Then `git add .gitignore` and commit.'],
    },
  ],
}
