# Use the official Bun image
FROM oven/bun:latest

WORKDIR /app

# Copy root package.json and workspaces
COPY package.json bun.lock ./
COPY packages/core/package.json ./packages/core/
COPY packages/cloud-sync/package.json ./packages/cloud-sync/

# Install dependencies
RUN bun install

# Copy source code
COPY packages/core ./packages/core
COPY packages/cloud-sync ./packages/cloud-sync

WORKDIR /app/packages/cloud-sync

# Expose the port
EXPOSE 3000

# Set environment variables (override in docker-compose or run command)
ENV NODE_ENV=production
ENV BASE_URL=http://localhost:3000

# Run the server
ENV DATABASE_URL=/data/betterx.db
RUN mkdir -p /data
VOLUME /data
CMD ["bun", "run", "src/index.ts"]
