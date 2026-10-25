import type { LearnTrack } from './types'

// Checks see `instructions` ([{ op, args }] from a Dockerfile), `lines` and `text`.
const idx = (op: string, re = '') => `instructions.findIndex((i) => i.op === ${JSON.stringify(op)}${re ? ` && /${re}/.test(i.args)` : ''})`

export const docker: LearnTrack = {
  id: 'docker',
  intro: 'Containerise an app step by step: a first Dockerfile, layer caching, production images, multi-stage builds, .dockerignore, the CLI, Compose and a CI pipeline.',
  kind: 'text',
  lang: 'text',
  steps: [
    {
      id: 'first-dockerfile',
      title: 'Your first Dockerfile',
      learn: `A Dockerfile is a recipe for an image, one instruction per line:

- \`FROM\` the base image (\`node:22-alpine\`)
- \`WORKDIR /app\` sets the folder for the next steps
- \`COPY\` files in, \`RUN\` commands at build time
- \`CMD ["node", "server.js"]\` is what the container runs (exec form, a JSON array)`,
      task: 'Write a Dockerfile for a Node app: base `node:22-alpine`, workdir `/app`, copy everything, run `npm ci`, and start with `node server.js` in exec form.',
      starter: `# Dockerfile
`,
      solution: `FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]
`,
      tests: [
        ['starts FROM node:22-alpine', 'expect(instructions[0]).toEqual({ op: "FROM", args: "node:22-alpine" })'],
        ['sets WORKDIR /app', `expect(${idx('WORKDIR', '^\\/app$')}).toBeGreaterThan(0)`],
        ['copies the code and runs npm ci', `expect(${idx('COPY')}).toBeGreaterThan(0); expect(${idx('RUN', '^npm ci$')}).toBeGreaterThan(${idx('COPY')})`],
        ['CMD in exec form', 'const cmd = instructions.find((i) => i.op === "CMD"); expect(JSON.parse(cmd?.args ?? "null")).toEqual(["node", "server.js"])'],
      ],
      hints: ['Five lines: FROM, WORKDIR, COPY, RUN, CMD.', 'Exec form is a JSON array: `CMD ["node", "server.js"]`.'],
    },
    {
      id: 'layer-cache',
      title: 'Cache the dependency layer',
      learn: `Each instruction is a cached **layer**. When a file you \`COPY\` changes, that layer and every layer after it rebuild.

Source code changes often, dependencies rarely. So copy \`package.json\` and the lockfile first, install, **then** copy the rest: a code change no longer reinstalls everything.`,
      task: 'Reorder this Dockerfile so `npm ci` stays cached when only the source changes.',
      starter: `FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]
`,
      solution: `FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
`,
      tests: [
        ['copies the package files first', `expect(${idx('COPY', 'package')}).toBeGreaterThan(0); expect(${idx('COPY', 'package')}).toBeLessThan(${idx('RUN', 'npm ci')})`],
        ['installs before copying the source', `const all = ${idx('COPY', '^\\.\\s+\\.')}; expect(all).toBeGreaterThan(${idx('RUN', 'npm ci')})`],
        ['still starts the app', 'expect(instructions.at(-1).op).toBe("CMD")'],
      ],
      hints: ['`COPY package.json package-lock.json ./` (or `COPY package*.json ./`).', 'Order: package files → `RUN npm ci` → `COPY . .`.'],
    },
    {
      id: 'production',
      title: 'A production image',
      learn: `For production:

- \`ENV NODE_ENV=production\` and \`npm ci --omit=dev\` skip dev dependencies
- \`EXPOSE 3000\` documents the port
- \`USER node\`: never run the app as root (the official image has a \`node\` user)`,
      task: 'Make the image production-ready: set `NODE_ENV=production`, install without dev dependencies, expose port 3000 and run as the `node` user.',
      starter: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
`,
      solution: `FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
`,
      tests: [
        ['sets NODE_ENV=production', `expect(${idx('ENV', 'NODE_ENV[= ]production')}).toBeGreaterThan(0)`],
        ['installs without dev dependencies', `expect(${idx('RUN', 'npm ci --(omit=dev|only=production|production)')}).toBeGreaterThan(0)`],
        ['exposes 3000', `expect(${idx('EXPOSE', '^3000$')}).toBeGreaterThan(0)`],
        ['runs as node before CMD', `expect(${idx('USER', '^node$')}).toBeGreaterThan(0); expect(${idx('USER', '^node$')}).toBeLessThan(${idx('CMD')})`],
      ],
      hints: ['`ENV NODE_ENV=production` near the top.', '`RUN npm ci --omit=dev`, `EXPOSE 3000`, `USER node` before `CMD`.'],
    },
    {
      id: 'multi-stage',
      title: 'Multi-stage builds',
      learn: `Build tools (TypeScript, bundlers, dev dependencies) don't belong in the final image. A **multi-stage** build compiles in one stage and copies only the output into a small runtime stage:

\`\`\`
FROM node:22-alpine AS build
…
FROM node:22-alpine
COPY --from=build /app/dist ./dist
\`\`\``,
      task: 'Split into a `build` stage (install all deps, copy source, `npm run build`) and a runtime stage that installs prod deps only and copies `/app/dist` from `build`, then runs `node dist/server.js`.',
      starter: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
`,
      solution: `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
`,
      tests: [
        ['has a stage named build', `expect(${idx('FROM', '\\s+AS\\s+build$', )}).toBe(0)`],
        ['has a second FROM for the runtime', 'expect(instructions.filter((i) => i.op === "FROM").length).toBe(2)'],
        ['copies dist from the build stage', `const second = instructions.map((i) => i.op).lastIndexOf("FROM"); expect(${idx('COPY', '--from=build\\s+\\/app\\/dist')}).toBeGreaterThan(second)`],
        ['the runtime installs prod deps only', 'const second = instructions.map((i) => i.op).lastIndexOf("FROM"); expect(instructions.slice(second).some((i) => i.op === "RUN" && /--omit=dev/.test(i.args))).toBe(true); expect(instructions.slice(second).some((i) => /npm run build/.test(i.args))).toBe(false)'],
      ],
      hints: ['Name the first stage: `FROM node:22-alpine AS build`.', 'In the second stage: `COPY --from=build /app/dist ./dist`.'],
    },
    {
      id: 'dockerignore',
      title: '.dockerignore',
      learn: `\`COPY . .\` sends the whole folder (the **build context**) to Docker. A \`.dockerignore\` keeps things out: faster builds, smaller images, and no secrets baked in.

One pattern per line, like \`.gitignore\`.`,
      task: 'Write a `.dockerignore` that excludes `node_modules`, `.git`, `.env` (and any `.env.*` files), `dist` and `*.log`.',
      starter: `# .dockerignore
`,
      solution: `node_modules
.git
.env
.env.*
dist
*.log
`,
      tests: [
        ['ignores node_modules and .git', 'expect(lines).toContain("node_modules"); expect(lines).toContain(".git")'],
        ['ignores .env and .env.*', 'expect(lines).toContain(".env"); expect(lines).toContain(".env.*")'],
        ['ignores dist and logs', 'expect(lines).toContain("dist"); expect(lines).toContain("*.log")'],
      ],
      hints: ['One pattern per line.', 'Six lines: node_modules, .git, .env, .env.*, dist, *.log.'],
    },
    {
      id: 'cli',
      title: 'Build and run',
      learn: `- \`docker build -t name:tag .\` builds an image from the Dockerfile here
- \`docker run -d -p HOST:CONTAINER --name web name:tag\` starts it in the background, publishing a port
- \`docker logs web\` shows its output; \`docker stop web\` stops it

Tag images with a version, not just \`latest\`.`,
      task: 'Build the image as `shop:1.0`, run it detached as `web` with host port 8080 mapped to container port 3000, then show its logs.',
      starter: `docker run shop
`,
      solution: `docker build -t shop:1.0 .
docker run -d -p 8080:3000 --name web shop:1.0
docker logs web
`,
      tests: [
        ['builds shop:1.0 from this folder', 'expect(lines[0]).toMatch(/^docker build (-t|--tag) shop:1\\.0 \\.$/)'],
        ['runs detached with 8080:3000 as web', 'const run = lines.find((l) => l.startsWith("docker run")) ?? ""; expect(run).toMatch(/(^| )-d( |$)/); expect(run).toMatch(/-p 8080:3000/); expect(run).toMatch(/--name web/); expect(run).toMatch(/shop:1\\.0$/)'],
        ['shows the logs', 'expect(lines.at(-1)).toBe("docker logs web")'],
      ],
      hints: ['`-p` is HOST:CONTAINER, so `-p 8080:3000`.', 'The image name comes last: `docker run -d -p 8080:3000 --name web shop:1.0`.'],
    },
    {
      id: 'compose',
      title: 'Docker Compose',
      learn: `Compose runs several containers together from \`compose.yaml\`. Services reach each other by **service name** (not \`localhost\`, which is the container itself), and data that must survive goes in a **named volume**:

\`\`\`
services:
  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
\`\`\``,
      task: 'Finish the file: the `api` builds from `.`, publishes 3000:3000, connects to `postgres://app:secret@db:5432/app` and depends on `db`; `db` stores its data in the named volume `pgdata`.',
      starter: `services:
  api:
    build: .
    environment:
      DATABASE_URL: postgres://app:secret@localhost:5432/app
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
`,
      solution: `services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`,
      tests: [
        ['the API reaches the database by service name', 'expect(text).toMatch(/DATABASE_URL:\\s*postgres:\\/\\/app:secret@db:5432\\/app/); expect(text).not.toMatch(/@localhost/)'],
        ['publishes 3000:3000 and depends on db', 'expect(text).toMatch(/ports:\\s*\\n\\s*- "?3000:3000"?/); expect(text).toMatch(/depends_on:\\s*(\\n\\s*- db|\\[\\s*db\\s*\\])/)'],
        ['db data lives in the pgdata volume', 'expect(text).toMatch(/- pgdata:\\/var\\/lib\\/postgresql\\/data/); expect(text).toMatch(/^volumes:\\s*\\n\\s+pgdata:/m)'],
      ],
      hints: ['Replace `localhost` with the service name `db`.', 'Add `volumes:` under `db` and a top-level `volumes: pgdata:` section.'],
    },
    {
      id: 'ci',
      title: 'A CI pipeline',
      learn: `Continuous integration runs your checks on every push. In GitHub Actions a workflow lists **steps**; if one fails, the job stops, so tests must run **before** anything is built or deployed:

\`\`\`
- uses: actions/checkout@v4
- run: npm ci
- run: npm test
\`\`\``,
      task: 'Complete the workflow: check out the code, set up Node 22, `npm ci`, `npm run lint`, `npm test`, and only then `docker build -t shop .`.',
      starter: `name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t shop .
`,
      solution: `name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: docker build -t shop .
`,
      tests: [
        ['checks out and sets up Node 22', 'expect(text).toMatch(/uses: actions\\/checkout@v\\d/); expect(text).toMatch(/uses: actions\\/setup-node@v\\d/); expect(text).toMatch(/node-version: "?22"?/)'],
        ['installs, lints and tests', 'for (const c of ["npm ci", "npm run lint", "npm test"]) expect(lines).toContain(`- run: ${c}`)'],
        ['tests run before the build', 'const at = (c) => lines.indexOf(`- run: ${c}`); expect(at("npm ci")).toBeLessThan(at("npm test")); expect(at("npm test")).toBeLessThan(at("docker build -t shop ."))'],
      ],
      hints: ['Steps run top to bottom.', 'Add `uses: actions/checkout@v4` and `actions/setup-node@v4` (with `node-version: 22`) first.'],
    },
  ],
}
