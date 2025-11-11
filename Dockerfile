# 1. Use Node.js base image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Install pnpm globally as root
RUN npm install -g pnpm

# 4. Copy dependency files
COPY package.json pnpm-lock.yaml ./

# 5. Install dependencies
RUN pnpm install --frozen-lockfile

# 6. Copy source code
COPY . .

# 7. Create non-root user
RUN adduser -D appuser

# 8. Give ownership of /app to the new user
RUN chown -R appuser:appuser /app

# 9. Switch to non-root user
USER appuser

# 10. Expose port
EXPOSE 3000

# 11. Start app
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

