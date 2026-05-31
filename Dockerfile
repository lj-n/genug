FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/src/lib/server/db/migrations ./src/lib/server/db/migrations
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["node", "build/index.js"]
