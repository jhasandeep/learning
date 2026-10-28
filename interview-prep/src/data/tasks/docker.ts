import type { TaskPath } from './types'

export const docker: TaskPath = {
  id: 'docker',
  title: 'Docker & DevOps',
  blurb: 'Write real Dockerfiles, Compose files and commands, and learn caching and multi-stage builds.',
  tasks: [
    {
      id: 'dockerfile-node',
      kind: 'rules',
      language: 'text',
      title: 'Write a Dockerfile for a Node app',
      goal: 'Package a Node.js server so it starts with `node server.js` on port 3000.',
      steps: [
        'Start `FROM node:20-alpine` and set `WORKDIR /app`.',
        'Copy only `package*.json` first, run `npm ci`, and THEN copy the rest (so dependency installs are cached).',
        '`EXPOSE 3000` and start with `CMD ["node", "server.js"]`.',
      ],
      starter: `# Write your Dockerfile
`,
      hints: ['Docker caches each instruction: put the rarely-changing steps first.', 'Order: `COPY package*.json ./`, `RUN npm ci`, `COPY . .`.', 'The JSON form of CMD is `CMD ["node", "server.js"]`.'],
      solution: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
`,
      rules: [
        { label: 'Starts `FROM node:20-alpine`', match: /^\s*FROM\s+node:20-alpine\s*$/m, hint: 'FROM node:20-alpine' },
        { label: 'Sets `WORKDIR /app`', match: /^\s*WORKDIR\s+\/app\s*$/m, hint: 'WORKDIR /app' },
        { label: 'Copies `package*.json` and runs `npm ci` before copying the source', match: /COPY\s+package\*\.json[^\n]*\n\s*RUN\s+npm\s+(ci|install)[\s\S]*COPY\s+\.\s+\./, hint: 'COPY package*.json ./ → RUN npm ci → COPY . .' },
        { label: 'Exposes port 3000', match: /^\s*EXPOSE\s+3000\s*$/m, hint: 'EXPOSE 3000' },
        { label: 'Starts with `CMD ["node", "server.js"]`', match: /^\s*CMD\s+\[\s*["']node["']\s*,\s*["']server\.js["']\s*\]\s*$/m, hint: 'CMD ["node", "server.js"]' },
      ],
      learned: 'Layer order controls build speed: copy the dependency list first so `npm ci` is reused until your dependencies actually change.',
    },
    {
      id: 'dockerignore',
      kind: 'rules',
      language: 'text',
      title: 'Keep junk and secrets out with .dockerignore',
      goal: 'Write a `.dockerignore` that keeps the image small and safe.',
      steps: [
        'Ignore `node_modules` (it is reinstalled inside the image).',
        'Ignore `.git` and the `Dockerfile` itself.',
        'Ignore `.env` and `*.log` so secrets and logs never end up in an image.',
      ],
      starter: `# .dockerignore
`,
      hints: ['One pattern per line.', 'Secrets such as `.env` must never be copied into an image.', 'Wildcards work: `*.log`.'],
      solution: `node_modules
.git
Dockerfile
.env
*.log
`,
      rules: [
        { label: 'Ignores `node_modules`', match: /^\s*node_modules\/?\s*$/m, hint: 'node_modules' },
        { label: 'Ignores `.git`', match: /^\s*\.git\/?\s*$/m, hint: '.git' },
        { label: 'Ignores the `Dockerfile`', match: /^\s*Dockerfile\s*$/m, hint: 'Dockerfile' },
        { label: 'Ignores `.env` (secrets)', match: /^\s*\.env\s*$/m, hint: '.env' },
        { label: 'Ignores `*.log`', match: /^\s*\*\.log\s*$/m, hint: '*.log' },
      ],
      learned: '`.dockerignore` shrinks the build context and, more importantly, stops secrets from being baked into an image anyone can pull.',
    },
    {
      id: 'compose',
      kind: 'rules',
      language: 'yaml',
      title: 'Run an app and a database with Compose',
      goal: 'Write `docker-compose.yml` with a `web` service and a `db` (Postgres) service.',
      steps: [
        '`web` is built from the current folder (`build: .`), publishes `"3000:3000"` and `depends_on` the `db`.',
        '`db` uses `image: postgres:16` with `POSTGRES_PASSWORD` in `environment`.',
        'Store the database files in a named volume `pgdata` mounted at `/var/lib/postgresql/data`.',
      ],
      starter: `# docker-compose.yml
services:
`,
      hints: ['Services are listed under `services:` with their names as keys.', 'A named volume is declared at the bottom under `volumes:` and mounted in the service.', '`ports: ["3000:3000"]` maps host:container.'],
      solution: `services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`,
      rules: [
        { label: 'Has a `web` service built with `build: .`', match: /^\s*web:\s*\n(?:\s+.*\n)*?\s+build:\s*\.\s*$/m, hint: 'web: build: .' },
        { label: 'Publishes port `"3000:3000"`', match: /["']?3000:3000["']?/, hint: 'ports: - "3000:3000"' },
        { label: '`web` depends on `db`', match: /depends_on:\s*\n\s*-\s*db/, hint: 'depends_on: - db' },
        { label: 'Has a `db` service using `postgres:16`', match: /^\s*db:\s*\n(?:\s+.*\n)*?\s+image:\s*postgres:16\s*$/m, hint: 'db: image: postgres:16' },
        { label: 'Sets `POSTGRES_PASSWORD`', match: /POSTGRES_PASSWORD\s*[:=]/, hint: 'environment: POSTGRES_PASSWORD: example' },
        { label: 'Mounts the `pgdata` volume at the Postgres data folder', match: /-\s*pgdata:\/var\/lib\/postgresql\/data/, hint: '- pgdata:/var/lib/postgresql/data' },
        { label: 'Declares the `pgdata` volume at the bottom', match: /^volumes:\s*\n\s+pgdata:/m, hint: 'volumes: pgdata:' },
      ],
      learned: 'Compose describes a whole stack in one file; named volumes keep database data alive when containers are recreated.',
    },
    {
      id: 'multi-stage',
      kind: 'rules',
      language: 'text',
      title: 'Shrink the image with a multi-stage build',
      goal: 'Build a React app in one stage and serve only the static files from a tiny Nginx image.',
      steps: [
        'Stage 1: `FROM node:20-alpine AS build`, install dependencies and run `npm run build`.',
        'Stage 2: `FROM nginx:alpine` and `COPY --from=build /app/dist /usr/share/nginx/html`.',
        '`EXPOSE 80`. Node and the source code must not exist in the final image.',
      ],
      starter: `# Multi-stage Dockerfile
`,
      hints: ['Name a stage with `AS build` and refer to it later with `--from=build`.', 'Only the last `FROM` becomes the final image.', 'The build output of Vite is the `dist` folder.'],
      solution: `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
`,
      rules: [
        { label: 'First stage is `FROM node:20-alpine AS build`', match: /^\s*FROM\s+node:20-alpine\s+AS\s+build\s*$/im, hint: 'FROM node:20-alpine AS build' },
        { label: 'Runs `npm run build`', match: /^\s*RUN\s+npm\s+run\s+build\s*$/m, hint: 'RUN npm run build' },
        { label: 'Second stage is `FROM nginx:alpine`', match: /^\s*FROM\s+nginx:alpine\s*$/m, hint: 'FROM nginx:alpine' },
        { label: 'Copies the build output with `COPY --from=build`', match: /COPY\s+--from=build\s+\/app\/dist\s+\/usr\/share\/nginx\/html/, hint: 'COPY --from=build /app/dist /usr/share/nginx/html' },
        { label: 'Exposes port 80', match: /^\s*EXPOSE\s+80\s*$/m, hint: 'EXPOSE 80' },
        { label: 'Has two `FROM` stages', match: /^\s*FROM\s/im, min: 2, hint: 'You need one FROM per stage.' },
      ],
      learned: 'Multi-stage builds compile in a big image but ship only the result in a small one: smaller, faster and safer to deploy.',
    },
    {
      id: 'cli-commands',
      kind: 'rules',
      language: 'text',
      title: 'Build, run and inspect a container',
      goal: 'Use the Docker commands you will type every day.',
      steps: [
        'Build an image tagged `shop` from the current folder.',
        'Run it in the background (`-d`), named `shop`, mapping port `3000:3000`.',
        'Show the running containers, follow the logs of `shop`, then stop and remove it.',
      ],
      starter: `# Type one docker command per line
`,
      hints: ['`docker build -t shop .` (the dot is the build folder).', '`docker run -d --name shop -p 3000:3000 shop`', '`docker ps`, `docker logs -f shop`, `docker stop shop`, `docker rm shop`.'],
      solution: `docker build -t shop .
docker run -d --name shop -p 3000:3000 shop
docker ps
docker logs -f shop
docker stop shop
docker rm shop
`,
      rules: [
        { label: 'Builds with `docker build -t shop .`', match: /^\s*docker\s+build\s+-t\s+shop\s+\.\s*$/m, hint: 'docker build -t shop .' },
        { label: 'Runs detached, named `shop`, port `3000:3000`', match: /^\s*docker\s+run\s+(?=(?:[^\n]*\s)?-d\b)(?=(?:[^\n]*\s)?--name\s+shop)(?=(?:[^\n]*\s)?-p\s+3000:3000)[^\n]*\bshop\s*$/m, hint: 'docker run -d --name shop -p 3000:3000 shop' },
        { label: 'Lists containers with `docker ps`', match: /^\s*docker\s+ps\b/m, hint: 'docker ps' },
        { label: 'Reads the logs of `shop`', match: /^\s*docker\s+logs\s+(-f\s+)?shop\s*$/m, hint: 'docker logs -f shop' },
        { label: 'Stops and removes the container', match: /docker\s+stop\s+shop[\s\S]*docker\s+rm\s+shop/, hint: 'docker stop shop, then docker rm shop' },
      ],
      learned: 'The daily loop is build, run, inspect, stop: an image is the recipe and a container is one running copy of it.',
    },
  ],
}
