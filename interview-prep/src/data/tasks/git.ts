import type { TaskPath } from './types'

// Type the commands you would run, one per line. The checker looks for the right commands
// in the right order, so you can learn the workflow without a repository.

export const git: TaskPath = {
  id: 'git',
  title: 'Git',
  blurb: 'Practise the commands you use every day: commit, branch, merge, undo and share.',
  tasks: [
    {
      id: 'first-commit',
      kind: 'rules',
      language: 'text',
      title: 'Make your first commit',
      goal: 'Turn a folder into a repository and save your first snapshot.',
      steps: [
        'Start a repository in the current folder.',
        'Stage all your files.',
        'Commit them with the message `"Initial commit"`.',
        'Check the result with the command that shows the short history.',
      ],
      starter: `# Type one git command per line
`,
      hints: ['The command to create a repository is `git init`.', '`git add .` stages everything in the folder.', '`git commit -m "message"`, then `git log --oneline` shows the history.'],
      solution: `git init
git add .
git commit -m "Initial commit"
git log --oneline
`,
      rules: [
        { label: '`git init` starts the repository', match: /^\s*git\s+init\b/m, hint: 'git init' },
        { label: '`git add .` stages the files', match: /^\s*git\s+add\s+(\.|-A|--all)\s*$/m, hint: 'git add .' },
        { label: '`git commit -m "Initial commit"` saves the snapshot', match: /^\s*git\s+commit\s+-m\s+["']Initial commit["']\s*$/m, hint: 'git commit -m "Initial commit"' },
        { label: '`git log --oneline` shows the history', match: /^\s*git\s+log\s+--oneline/m, hint: 'git log --oneline' },
        { label: 'Commands are in a sensible order (init, add, commit)', match: /git\s+init[\s\S]*git\s+add[\s\S]*git\s+commit/, hint: 'You must init and add before you commit.' },
      ],
      learned: 'Git saves snapshots in three steps: the working folder, the staging area (`add`), and the history (`commit`).',
    },
    {
      id: 'branch-merge',
      kind: 'rules',
      language: 'text',
      title: 'Work on a feature branch and merge it',
      goal: 'Build a login feature on its own branch, then bring it into `main`.',
      steps: [
        'Create and switch to a branch named `feature/login`.',
        'Stage and commit your work with the message `"Add login page"`.',
        'Switch back to `main` and merge `feature/login` into it.',
        'Delete the branch you no longer need.',
      ],
      starter: `# Type one git command per line
`,
      hints: ['`git switch -c feature/login` creates and switches in one step.', 'Move back with `git switch main`.', '`git merge feature/login` then `git branch -d feature/login`.'],
      solution: `git switch -c feature/login
git add .
git commit -m "Add login page"
git switch main
git merge feature/login
git branch -d feature/login
`,
      rules: [
        { label: 'Creates and switches to `feature/login`', match: /^\s*git\s+(switch\s+-c|checkout\s+-b)\s+feature\/login\s*$/m, hint: 'git switch -c feature/login' },
        { label: 'Commits with "Add login page"', match: /^\s*git\s+commit\s+-m\s+["']Add login page["']/m, hint: 'git commit -m "Add login page"' },
        { label: 'Switches back to `main`', match: /^\s*git\s+(switch|checkout)\s+main\s*$/m, hint: 'git switch main' },
        { label: 'Merges `feature/login`', match: /^\s*git\s+merge\s+feature\/login\s*$/m, hint: 'git merge feature/login' },
        { label: 'Deletes the merged branch', match: /^\s*git\s+branch\s+-d\s+feature\/login\s*$/m, hint: 'git branch -d feature/login' },
        { label: 'The merge happens after switching back to `main`', match: /git\s+(switch|checkout)\s+main[\s\S]*git\s+merge\s+feature\/login/, hint: 'You merge INTO the branch you are standing on.' },
      ],
      learned: 'Branches let you work in isolation; you merge while standing on the branch that should receive the changes.',
    },
    {
      id: 'undo',
      kind: 'rules',
      language: 'text',
      title: 'Undo things safely',
      goal: 'Fix four different mistakes with the right undo command.',
      steps: [
        'Unstage `app.js` that you added by mistake (keep your edits).',
        'Throw away the unwanted local edits in `style.css`.',
        'Safely undo the last commit that is already pushed by creating a reverse commit.',
        'Undo your last LOCAL commit but keep the changes staged.',
      ],
      starter: `# Type one git command per line
`,
      hints: ['`git restore` has two modes: one for the staging area, one for the working folder.', 'For a pushed commit never rewrite history: use the command that makes a new reversing commit.', '`git reset --soft HEAD~1` moves back one commit and keeps the changes staged.'],
      solution: `git restore --staged app.js
git restore style.css
git revert HEAD
git reset --soft HEAD~1
`,
      rules: [
        { label: 'Unstages `app.js` with `git restore --staged`', match: /^\s*git\s+restore\s+--staged\s+app\.js\s*$/m, hint: 'git restore --staged app.js' },
        { label: 'Discards edits in `style.css` with `git restore`', match: /^\s*git\s+restore\s+style\.css\s*$/m, hint: 'git restore style.css' },
        { label: 'Undoes a pushed commit with `git revert HEAD`', match: /^\s*git\s+revert\s+HEAD\s*$/m, hint: 'git revert HEAD' },
        { label: 'Undoes the last local commit with `git reset --soft HEAD~1`', match: /^\s*git\s+reset\s+--soft\s+HEAD~1\s*$/m, hint: 'git reset --soft HEAD~1' },
        { label: 'Does not use `--hard` (it destroys work)', match: /--hard/, absent: true, hint: 'Avoid reset --hard here: it deletes your changes.' },
      ],
      learned: '`restore` fixes files, `revert` safely undoes shared commits, and `reset` rewrites local history: pick by what you want to undo.',
    },
    {
      id: 'remote',
      kind: 'rules',
      language: 'text',
      title: 'Share your work with a remote',
      goal: 'Connect your repository to GitHub, publish it, and stay up to date.',
      steps: [
        'Add a remote named `origin` pointing to `https://github.com/you/shop.git`.',
        'Push `main` and set it as the upstream with the `-u` flag.',
        'Later, bring in your teammates\' work with `git pull --rebase`.',
      ],
      starter: `# Type one git command per line
`,
      hints: ['`git remote add <name> <url>`', 'The first push needs `-u`: `git push -u origin main`.', '`git pull --rebase` replays your commits on top of the remote ones.'],
      solution: `git remote add origin https://github.com/you/shop.git
git push -u origin main
git pull --rebase
`,
      rules: [
        { label: 'Adds the `origin` remote with the right URL', match: /^\s*git\s+remote\s+add\s+origin\s+https:\/\/github\.com\/you\/shop\.git\s*$/m, hint: 'git remote add origin https://github.com/you/shop.git' },
        { label: 'Pushes `main` with `-u` (upstream)', match: /^\s*git\s+push\s+-u\s+origin\s+main\s*$/m, hint: 'git push -u origin main' },
        { label: 'Pulls with `--rebase`', match: /^\s*git\s+pull\s+--rebase(\s+origin\s+main)?\s*$/m, hint: 'git pull --rebase' },
        { label: 'Does not force push', match: /--force|\s-f\b/, absent: true, hint: 'Never force push to a shared branch.' },
      ],
      learned: 'A remote is just another copy of the repository: `push` sends your commits, `pull` fetches and integrates theirs.',
    },
    {
      id: 'stash-conflict',
      kind: 'rules',
      language: 'text',
      title: 'Switch tasks and resolve a conflict',
      goal: 'Park unfinished work, update your branch, and finish a rebase with a conflict.',
      steps: [
        'Save your unfinished changes aside with `git stash`.',
        'Update with `git pull --rebase origin main`.',
        'Bring your parked work back with `git stash pop`.',
        'After fixing a conflict in `app.js`: stage it, then continue the rebase.',
      ],
      starter: `# Type one git command per line
`,
      hints: ['`git stash` and `git stash pop` are a pair.', 'When a rebase stops on a conflict, you edit the file, `git add` it, then continue.', '`git rebase --continue` finishes the step.'],
      solution: `git stash
git pull --rebase origin main
git stash pop
git add app.js
git rebase --continue
`,
      rules: [
        { label: 'Parks the work with `git stash`', match: /^\s*git\s+stash(\s+push)?\s*$/m, hint: 'git stash' },
        { label: 'Updates with `git pull --rebase origin main`', match: /^\s*git\s+pull\s+--rebase\s+origin\s+main\s*$/m, hint: 'git pull --rebase origin main' },
        { label: 'Restores the work with `git stash pop`', match: /^\s*git\s+stash\s+pop\s*$/m, hint: 'git stash pop' },
        { label: 'Stages the resolved file `app.js`', match: /^\s*git\s+add\s+app\.js\s*$/m, hint: 'git add app.js' },
        { label: 'Continues the rebase', match: /^\s*git\s+rebase\s+--continue\s*$/m, hint: 'git rebase --continue' },
        { label: 'Stash comes before the pull, and pop after it', match: /git\s+stash\s*\n[\s\S]*git\s+pull[\s\S]*git\s+stash\s+pop/, hint: 'Order: stash, pull, stash pop.' },
      ],
      learned: 'Stashing lets you switch context without committing half-finished work, and a conflict is resolved by editing, staging and continuing.',
    },
  ],
}
