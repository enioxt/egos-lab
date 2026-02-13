# 🦅 Eagle Eye Dockerfile
FROM oven/bun:1.1.26-alpine as base

WORKDIR /app

# Copy package Config
COPY package.json ./
COPY bun.lockb ./

# Install Dependencies
RUN bun install --production

# Copy Source Code
# We copy the specific apps/eagle-eye directory structure to match imports
COPY apps/eagle-eye ./apps/eagle-eye
COPY apps/eagle-eye/src/ui ./apps/eagle-eye/src/ui

# Copy Data (Mock/Real persistence should be a volume in production)
# Assuming metrics and results are in docs/eagle-eye-results like server.ts expects
# We need to recreate the relative path "../../../../docs" which is weird in container
# So we adjust the server.ts path OR we mimic the structure.
# Let's mimic the structure for safety.

WORKDIR /app
COPY docs/eagle-eye-results ./docs/eagle-eye-results

# Expose Dashboard Port
EXPOSE 3001

# Start the Dashboard
CMD ["bun", "run", "apps/eagle-eye/src/ui/server.ts"]
