# Use an official Node.js image as the base image
FROM node:14-alpine

# Add Nginx
RUN apk add --no-cache nginx

# Switch to root user to run apt commands
USER root

# Install dependencies for apt to work properly
RUN apk add --no-cache gnupg

# Ensure we're using the appropriate Ubuntu repositories
RUN sed -i '/xenial/d' /etc/apt/sources.list

# Install required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends apt-transport-https ca-certificates curl gnupg2

# Clean up APT when done
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Create and change to the app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the project files into the container
COPY . .

# Copy custom Nginx config
COPY .devcontainer/nginx.conf /etc/nginx/nginx.conf

# Expose the port on which the app will run
EXPOSE 8080

# Start the app
CMD ["sh", "-c", "nginx && npm start"]
