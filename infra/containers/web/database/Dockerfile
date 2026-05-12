FROM base:latest
WORKDIR /app
COPY database/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY database ./database
COPY shared ./shared
CMD ["npm", "start"]
