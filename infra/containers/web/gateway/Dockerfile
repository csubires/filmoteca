ARG BASE_IMAGE=filmoteca-web-base:latest
FROM ${BASE_IMAGE}

WORKDIR /app/web/gateway

COPY web/gateway ./
COPY web/frontend/public ../frontend/public

CMD ["npm", "start"]
