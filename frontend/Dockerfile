FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
