# ----------------------------------------------------
# Base Stage: Alpine Node.js with Corepack & pnpm
# ----------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Enable Corepack and pin pnpm to v9 to match lockfile
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ----------------------------------------------------
# Prod Dependencies Stage: Install production node_modules
# ----------------------------------------------------
FROM base AS prod-deps

# Copy only package manifests to maximize Docker layer caching
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY Shared/API/package.json ./Shared/API/
COPY Shared/UI/package.json ./Shared/UI/

# Install only production dependencies with BuildKit pnpm store cache
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --no-frozen-lockfile

# ----------------------------------------------------
# Builder Stage: Install all dependencies & build SPA
# ----------------------------------------------------
FROM base AS builder

# Copy package manifests
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY Shared/API/package.json ./Shared/API/
COPY Shared/UI/package.json ./Shared/UI/

# Install all dependencies (including devDependencies for build)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile

# Copy application source code
COPY . .

# Build the client SPA into /app/dist
RUN pnpm build

# ----------------------------------------------------
# Production Runner Stage: Minimal, lean runtime image
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Production environment variables
ENV NODE_ENV=production \
    PORT=5001

# Copy production node_modules from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built React client assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code and configurations
COPY index.js ./
COPY Shared ./Shared
COPY auth.server ./auth.server
COPY ecommerce.server ./ecommerce.server

# Run as non-root user for security
USER node

# Expose monolithic application port
EXPOSE 5001

# Start the server
CMD ["node", "index.js"]
