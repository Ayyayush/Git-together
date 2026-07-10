# -----------------------------
# Stage 1: Install Dependencies
# -----------------------------
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci 

# -----------------------------
# Stage 2: Production Image
# -----------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 7777

CMD ["npm", "start"]