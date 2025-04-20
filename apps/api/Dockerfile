FROM node:18-alpine

# Set up working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . ./

# Install Prisma globally
RUN npm install -g prisma

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Start the API
CMD ["node", "dist/index.js"]

