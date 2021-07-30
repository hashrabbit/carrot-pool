# syntax = docker/dockerfile:experimental

# Stage 1: Build deps from source including private github repos

FROM node:12

# Create working directory
WORKDIR /src

# Copy source excluding files in .dockerignore
COPY . .

# Build deps using lockfile
RUN  npm install

# Expose ports for stratum workers
EXPOSE 3010

CMD npm start

