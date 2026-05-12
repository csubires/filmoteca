FROM base:latest
WORKDIR /app
COPY i18n/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY i18n ./i18n
COPY shared ./shared
CMD ["npm", "start"]
