# Build stage
FROM node:23-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:23-slim

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Expose port 5173
EXPOSE 5173

# Start the server
CMD ["serve", "-s", "dist", "-l", "5173"]