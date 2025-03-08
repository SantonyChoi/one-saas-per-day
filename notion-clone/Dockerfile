# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm install -g npm@latest
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN cd frontend && npm run build

# Build the backend
RUN cd backend && npm run build

# Create data directory for SQLite
RUN mkdir -p /app/backend/data && chmod 777 /app/backend/data

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "backend/dist/index.js"] 