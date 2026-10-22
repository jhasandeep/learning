import type { SpotSet } from './types'

export const docker: SpotSet = {
  id: 'docker',
  bugs: [
    {
      id: 'cache-order',
      title: 'npm install on every build',
      task: 'Changing one line of source re-installs every dependency, so builds take 4 minutes.',
      lang: 'docker',
      code: `FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]`,
      line: 3,
      fixed: `FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]`,
      explain: 'Each instruction is a cached layer, and any change invalidates the layers after it. Copy the ==package files first==, install, then copy the source.',
      difficulty: 'Medium',
    },
    {
      id: 'localhost-db',
      title: 'Connection refused',
      task: 'In Docker Compose the API cannot reach Postgres: "connect ECONNREFUSED 127.0.0.1:5432".',
      lang: 'yaml',
      code: `services:
  api:
    build: .
    environment:
      DATABASE_URL: postgres://app:secret@localhost:5432/app
    depends_on: [db]
  db:
    image: postgres:16`,
      line: 5,
      fix: '      DATABASE_URL: postgres://app:secret@db:5432/app',
      explain: 'Inside a container, `localhost` is ==that container==. Compose gives each service a DNS name; use `db`.',
      difficulty: 'Easy',
    },
    {
      id: 'listen-host',
      title: 'Port mapped, page empty',
      task: '`docker run -p 3000:3000 app` starts, but `curl localhost:3000` gets "connection reset".',
      lang: 'javascript',
      code: `import express from 'express'
const app = express()
app.get('/', (req, res) => res.send('hi'))
app.listen(3000, '127.0.0.1')`,
      line: 4,
      fix: "app.listen(3000, '0.0.0.0')",
      explain: 'Listening on `127.0.0.1` only accepts connections from inside the container. Bind to ==`0.0.0.0`== so the published port reaches it.',
      difficulty: 'Medium',
    },
    {
      id: 'data-volume',
      title: 'The database forgot everything',
      task: 'After `docker compose down && docker compose up`, all data is gone.',
      lang: 'yaml',
      code: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]`,
      line: 6,
      fixed: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:`,
      explain: 'The data lived in the container\'s writable layer, deleted with the container. Mount a ==named volume== at the data directory.',
      difficulty: 'Easy',
    },
    {
      id: 'secret-arg',
      title: 'Token in the image',
      task: '`docker history` shows the npm token in plain text.',
      lang: 'docker',
      code: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
ENV NPM_TOKEN=npm_9f8a7b6c5d4e
RUN npm ci
COPY . .`,
      line: 4,
      fixed: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npm_token NPM_TOKEN=$(cat /run/secrets/npm_token) npm ci
COPY . .`,
      explain: '`ENV` and `ARG` values are ==baked into the image== layers and metadata. Use a BuildKit secret mount, which is never stored.',
      difficulty: 'Hard',
    },
    {
      id: 'ci-no-tests',
      title: 'Broken code shipped',
      task: 'A commit that fails its unit tests was deployed to production by this workflow.',
      lang: 'yaml',
      code: `on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: ./deploy.sh`,
      line: 8,
      fix: '      - run: npm test\n      - run: npm run build',
      explain: 'The pipeline never ==runs the tests==, so nothing stops a broken build. Test (and lint) before deploying; a failing step stops the job.',
      difficulty: 'Easy',
    },
  ],
}
