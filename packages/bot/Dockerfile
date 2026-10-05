FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY scripts ./scripts
COPY packages ./packages

RUN npm ci --ignore-scripts && npm run postinstall

ENV NODE_ENV=production

CMD ["node", "packages/bot/src/main.ts"]