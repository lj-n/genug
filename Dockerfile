FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN mkdir data
# run drizzle migration once for working build
RUN npm run drizzle:migrate
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

# drizzle migrations
COPY --from=builder /app/data data/
COPY /drizzle drizzle/

COPY start.sh .
RUN chmod +x start.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000

CMD [ "./start.sh" ]