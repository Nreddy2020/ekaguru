FROM node:22-alpine AS build

WORKDIR /app

# Do not open browser during build/start
ENV BROWSER=none

# Copy package files and install deps
COPY package*.json ./
COPY yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copy source and build static assets
COPY . .
RUN yarn build

FROM nginx:stable-alpine

# Copy built static files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Add custom nginx config to allow large uploads
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
