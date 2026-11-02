FROM node:22.23.4

WORKDIR /app

COPY package*.json .

RUN npm i

COPY . .

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD [ "node", "dist/server/entry.mjs" ]