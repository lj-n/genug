FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN mkdir data

# Right now we have to run the database migration once, for the build to work
RUN npm run drizzle:migrate
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

# Copy default database setup and migrations
COPY --from=builder /app/data data/
COPY /drizzle drizzle/

COPY start.sh .
RUN chmod +x start.sh

ARG ORIGIN_URL=http://localhost:3000

EXPOSE $ORIGIN_PORT

ENV NODE_ENV=production
ENV ORIGIN=$ORIGIN_URL

CMD [ "./start.sh" ]