FROM base:latest
WORKDIR /app
COPY auth/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY auth ./auth
COPY shared ./shared
CMD ["npm", "start"]
