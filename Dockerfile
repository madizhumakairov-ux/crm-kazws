FROM node:20-slim

WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy server
COPY server/ ./server/

# Copy client source and build it
COPY client/ ./client/

# Install server dependencies
RUN cd server && npm install --production

# Install client dependencies and build
RUN cd client && npm install && npm run build

# Seed database on first start
RUN cd server && node seed.js

EXPOSE 3001

CMD ["node", "server/index.js"]
