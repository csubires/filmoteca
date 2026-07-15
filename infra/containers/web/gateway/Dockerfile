ARG BASE_IMAGE=filmoteca-web-base:latest
FROM ${BASE_IMAGE}
WORKDIR /app/web/gateway
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev
CMD ["npm", "start"]
