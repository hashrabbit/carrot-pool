# syntax = docker/dockerfile:experimental

# Stage 1: Build deps from source including private github repos

FROM node:14

# Create working directory
WORKDIR /src

# Update and download system dependencies
RUN apt-get update && apt-get install -y openssh-client

# Create ssh directory
RUN mkdir -p -m 0700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

# Copy source excluding files in .dockerignore
COPY . .

# Build deps using lockfile
RUN npm ci --only=production

# Expose ports for stratum workers
EXPOSE 3010

# Run helper script as entrypoint to load configs based on environment
ENTRYPOINT node app.js
