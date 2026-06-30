# Local / self-hosted image. (Vercel deploys do not use this Dockerfile —
# they build via `npm run build` + the api/ serverless function.)

# Stage 1: Build the React client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Server/API deps now live in the root package.json.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
