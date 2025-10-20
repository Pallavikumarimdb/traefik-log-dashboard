# ==============================================================================
# Stage 1: Dependencies - Install production dependencies with build tools
# ==============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./

# Use npm ci for faster, more reliable installs
RUN npm ci --only=production && \
    npm cache clean --force

# ==============================================================================
# Stage 2: Builder - Build the application
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install dev dependencies for build
RUN npm ci && \
    npm cache clean --force

# Rebuild better-sqlite3 for Alpine
RUN npm rebuild better-sqlite3

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==============================================================================
# Stage 3: Runner - Use slim debian instead of distroless for better-sqlite3
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nodejs

# Create data directory BEFORE copying files
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Copy only necessary files from builder
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Ensure data directory has correct permissions after copy
RUN chown -R nodejs:nodejs /app/data

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]