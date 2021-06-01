FROM node:14-alpine

WORKDIR /app

COPY . /app

RUN apk --no-cache add yarn \
    && yarn install

CMD ["yarn", "start"]