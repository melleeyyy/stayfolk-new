# StayFolk — single-container deploy
# The image serves the site and the API from the same Node process.
FROM node:20-alpine

WORKDIR /app

# no dependencies to install: the server is pure Node
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# accounts, messages and uploads live here — mount a volume to keep them
VOLUME ["/app/server/data"]

CMD ["node", "server/index.js"]
