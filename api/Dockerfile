FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main"]
