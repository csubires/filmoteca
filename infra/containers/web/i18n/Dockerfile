ARG BASE_IMAGE=filmoteca-web-base:latest
FROM ${BASE_IMAGE}
WORKDIR /app/web/i18n
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev
CMD ["npm", "start"]
