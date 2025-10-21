# ==============================================================================
# Stage 1: Dependencies - Install production dependencies with build tools
# ==============================================================================
FROM node:22-slim AS deps

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./

# Use npm ci for faster, more reliable installs
RUN npm ci --only=production && \
    npm cache clean --force

# ==============================================================================
# Stage 2: Builder - Build the application
# ==============================================================================
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install dev dependencies for build
RUN npm ci && \
    npm cache clean --force

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==============================================================================
# Stage 3: Runner - Use Debian slim for better-sqlite3 compatibility
# ==============================================================================
FROM node:22-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install runtime dependencies for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Debian commands)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nodejs

# Create data directory BEFORE copying files
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Copy only necessary files from builder
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Copy node_modules with better-sqlite3 native bindings
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Ensure data directory has correct permissions after copy
RUN chown -R nodejs:nodejs /app/data

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]