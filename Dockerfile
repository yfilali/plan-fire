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

COPY server/package.json ./server/
RUN cd server && npm install --production

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_PATH=/data/state.json

EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "server/index.js"]
