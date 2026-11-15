FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY scripts ./scripts
COPY packages ./packages

RUN npm ci

ENV NODE_ENV=production

CMD ["node", "packages/bot/src/main.ts"]
