FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY static ./static
COPY messages ./messages
COPY project.inlang ./project.inlang
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY svelte.config.js ./
COPY tsconfig.json ./

# Stage builds pass the short commit SHA so the app surfaces a dev-flavoured
# version (`<version>-dev+<sha>`); prod builds leave it empty (ADR-0012).
ARG BUILD_SHA=
ENV BUILD_SHA=$BUILD_SHA

ENV DATABASE_URL=build
RUN npm run build
RUN npm prune --production


FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/src/lib/server/db/migrations src/lib/server/db/migrations/
COPY --from=builder /app/package.json ./

EXPOSE 3002

CMD ["node", "build"]
