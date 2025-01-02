# Base image for Node.js
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the backend server using PM2
CMD ["npx", "pm2-runtime", "start", "ecosystem.config.js"]
