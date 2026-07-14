FROM node:20-trixie-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends bash curl sqlite3 ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY web/package.json ./web/
COPY web/shared/package.json ./web/shared/
COPY web/auth/package.json ./web/auth/
COPY web/database/package.json ./web/database/
COPY web/gateway/package.json ./web/gateway/
COPY web/i18n/package.json ./web/i18n/

WORKDIR /app/web
RUN npm install --omit=dev

WORKDIR /app/web/auth/
RUN npm install --omit=dev

WORKDIR /app/web/database/
RUN npm install --omit=dev


WORKDIR /app/web/gateway/
RUN npm install --omit=dev


WORKDIR /app/web/i18n/
RUN npm install --omit=dev
