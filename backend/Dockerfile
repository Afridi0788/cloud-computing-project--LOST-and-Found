# Use official lightweight Node.js 20 LTS Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed and clean cache
RUN apk add --no-cache tzdata

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose backend REST API port
EXPOSE 5000

# Health check instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Node.js Express server
CMD ["node", "server.js"]
