# -----------------------------
# Stage 1: Install Dependencies
# -----------------------------
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy dependency files first for Docker layer caching
COPY package*.json ./

# Install exact dependencies from package-lock.json
RUN npm ci


# -----------------------------
# Stage 2: Production Image
# -----------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy installed dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy backend source code
COPY . .

EXPOSE 7777

CMD ["npm", "start"]