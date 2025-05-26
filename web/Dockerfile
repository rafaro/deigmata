FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache jq

COPY package.json yarn.lock ./

RUN jq 'del(.scripts.postinstall)' package.json > tmp.json && mv tmp.json package.json

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist/spa /usr/share/nginx/html

EXPOSE 8080

