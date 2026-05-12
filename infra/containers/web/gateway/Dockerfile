FROM base:latest
WORKDIR /app
COPY gateway/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY gateway ./gateway
COPY shared ./shared
CMD ["npm", "start"]

# /etc/docker/daemon.json
# { "features": { "buildkit": true } }
