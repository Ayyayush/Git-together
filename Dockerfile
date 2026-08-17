
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci


FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

# copying backend source code
COPY . .

EXPOSE 7777

CMD ["npm", "start"]