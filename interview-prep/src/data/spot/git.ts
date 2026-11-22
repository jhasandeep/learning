import type { SpotSet } from './types'

export const git: SpotSet = {
  id: 'git',
  bugs: [
    {
      id: 'reset-shared',
      title: 'Undoing a pushed commit',
      task: 'A bad commit is already on the shared `main`. After these commands, every teammate\'s next pull breaks.',
      lang: 'bash',
      code: `git switch main
git pull
git reset --hard HEAD~1
git push --force`,
      line: 3,
      fixed: `git switch main
git pull
git revert HEAD
git push`,
      also: [4],
      explain: 'Resetting and force-pushing ==rewrites shared history==. `git revert` adds a new commit that undoes the change, so nobody\'s clone breaks.',
      difficulty: 'Medium',
    },
    {
      id: 'gitignore-tracked',
      title: '.env is still committed',
      task: 'The secrets file keeps showing up in commits even though it is in `.gitignore`.',
      lang: 'bash',
      code: `echo ".env" >> .gitignore
git add .gitignore
git commit -m "Ignore .env"`,
      line: 2,
      fixed: `echo ".env" >> .gitignore
git rm --cached .env
git add .gitignore
git commit -m "Stop tracking .env"`,
      explain: '`.gitignore` only affects ==untracked== files. Remove it from the index with `git rm --cached` (and rotate the secrets: they are still in history).',
      difficulty: 'Easy',
    },
    {
      id: 'force-push',
      title: 'A teammate\'s commits vanished',
      task: 'After rebasing a shared feature branch, a colleague\'s pushed commits disappeared.',
      lang: 'bash',
      code: `git switch feature/login
git rebase main
git push --force`,
      line: 3,
      fix: 'git push --force-with-lease',
      explain: '`--force` overwrites whatever is on the remote. ==`--force-with-lease`== refuses if someone pushed since your last fetch.',
      difficulty: 'Medium',
    },
    {
      id: 'add-all',
      title: 'node_modules in the repo',
      task: 'A "small fix" commit added 40,000 files.',
      lang: 'bash',
      code: `git status
git add -A
git commit -m "fix: typo in header"`,
      line: 2,
      fix: 'git add src/components/header.tsx',
      explain: 'Staging everything grabs build output and dependencies (and secrets). Stage ==specific files== (or `git add -p`), and list `node_modules/` in `.gitignore`.',
      difficulty: 'Easy',
    },
    {
      id: 'amend-pushed',
      title: 'Diverged after amend',
      task: 'After fixing the commit message, `git push` is rejected as non-fast-forward. The commit was already pushed and pulled by others.',
      lang: 'bash',
      code: `git commit -m "feat: add serach"
git push
git commit --amend -m "feat: add search"
git push`,
      line: 3,
      fixed: `git commit -m "feat: add serach"
git push
# The commit is shared now: leave the typo, or fix the message in the PR's squash merge.`,
      also: [4],
      explain: '`--amend` creates a ==new commit== that replaces a shared one, which rewrites history. Only amend commits that have not been pushed.',
      difficulty: 'Medium',
    },
    {
      id: 'stash-untracked',
      title: 'The new file came along',
      task: 'Switching to `main` to fix a bug, the half-written `new-feature.ts` (never added) is still there and gets committed in the hotfix.',
      lang: 'bash',
      code: `git stash
git switch main
git switch -c hotfix/login
git add -A && git commit -m "fix: login redirect"`,
      line: 1,
      fix: 'git stash -u',
      explain: 'Plain `git stash` only shelves tracked changes. ==`-u`== (include untracked) stashes new files too.',
      difficulty: 'Hard',
    },
  ],
}
