ARG BASE_IMAGE=filmoteca-web-base:latest
FROM ${BASE_IMAGE}

WORKDIR /app/web/database

COPY web/database ./

CMD ["npm", "start"]
