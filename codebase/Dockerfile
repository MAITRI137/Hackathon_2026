FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Install OS dependencies that might be needed for @react-pdf/renderer or Canvas
# if needed in the future. Usually, pure React PDF doesn't need much, but
# bullseye has good defaults.
# We also install sqlite3 for any local DB inspection if needed.
RUN apt-get update && apt-get install -y sqlite3 openssl && rm -rf /var/lib/apt/lists/*

# Copy package management files
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for local dev and testing)
RUN npm ci

# Copy Prisma schema and generate client early so it caches
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000
EXPOSE 5555

# Setup a safe default command.
# For local dev, we usually override this in docker-compose, but we'll set a fallback.
CMD ["npm", "run", "dev"]
