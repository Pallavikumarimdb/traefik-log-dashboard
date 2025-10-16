# ==============================================================================
# Stage 1: Dependencies - Install only production dependencies
# ==============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

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

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install dev dependencies for build
RUN npm ci && \
    npm cache clean --force

# Build Next.js application
# This will generate the standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==============================================================================
# Stage 3: Runner - Minimal production image using distroless
# ==============================================================================
FROM gcr.io/distroless/nodejs22-debian12:nonroot

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy only necessary files from builder
# The standalone output includes all necessary dependencies
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public

# Distroless runs as nonroot user (uid 65532) by default
# No USER directive needed

EXPOSE 3000

# Distroless doesn't have shell, use exec form
CMD ["server.js"]