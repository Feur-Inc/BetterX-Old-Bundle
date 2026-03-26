FROM oven/bun:latest

WORKDIR /app

# Install deps for cloud-sync only — no monorepo workspace needed
COPY packages/cloud-sync/package.json ./package.json
RUN bun install --production

# Copy source
COPY packages/cloud-sync/src ./src

EXPOSE 4000

ENV NODE_ENV=production
ENV DATABASE_URL=/data/betterx.db

RUN mkdir -p /data
VOLUME /data

CMD ["bun", "run", "src/index.ts"]
