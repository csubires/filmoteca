name: filmoteca

services:

  web-base:
    build:
      context: ../../data/filmoteca
      dockerfile: infra/containers/web/base/Dockerfile
      network: host
    image: filmoteca-web-base:latest
    container_name: filmoteca-web-base


  database:
    image: filmoteca-database
    build:
      context: ../../data/filmoteca
      dockerfile: infra/containers/web/database/Dockerfile
      network: host
    container_name: filmoteca-database
    environment:
      NODE_ENV: production
      DB_PATH: /app/data/filmoteca.db
      QUERIES_PATH: /app/web/database/queries
    volumes:
      - /home/user/server/data/filmoteca/data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/database/health"]
      interval: 20s
      timeout: 5s
      retries: 3
    networks: [filmoteca-net]
    restart: unless-stopped

  auth:
    image: filmoteca-auth
    build:
      context: ../../data/filmoteca
      dockerfile: infra/containers/web/auth/Dockerfile
      network: host
    container_name: filmoteca-auth
    environment:
      NODE_ENV: production
      DATABASE_URL: http://database:3003
    volumes:
      - /home/user/server/data/filmoteca/data:/app/data
    depends_on:
      database:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/auth/health"]
      interval: 20s
      timeout: 5s
      retries: 3
    networks: [filmoteca-net]
    restart: unless-stopped

  i18n:
    image: filmoteca-i18n
    build:
      context: ../../data/filmoteca
      dockerfile: infra/containers/web/i18n/Dockerfile
      network: host
    container_name: filmoteca-i18n
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/i18n/health"]
      interval: 20s
      timeout: 5s
      retries: 3
    networks: [filmoteca-net]
    restart: unless-stopped

  gateway:
    image: filmoteca-gateway
    build:
      context: ../../data/filmoteca
      dockerfile: infra/containers/web/gateway/Dockerfile
      network: host
    container_name: filmoteca-gateway
    environment:
      NODE_ENV: production
      DATABASE_URL: http://database:3003
      AUTH_URL: http://auth:3001
      I18N_URL: http://i18n:3002
    volumes:
      - /home/user/server/data/filmoteca/data:/app/data:ro
    depends_on:
      database:
        condition: service_healthy
      auth:
        condition: service_healthy
      i18n:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/gateway/health"]
      interval: 20s
      timeout: 5s
      retries: 3
    networks: [filmoteca-net]
    restart: unless-stopped

  nginx:
    image: filmoteca-nginx
    build:
      context: ../../data/filmoteca
      dockerfile: infra/containers/web/nginx/Dockerfile
      network: host
    container_name: filmoteca-nginx
    ports:
      - "8080:443"
    volumes:
      - /home/user/server/data/filmoteca/data/logs/nginx:/var/log/nginx
    depends_on:
      gateway:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-fk", "https://localhost/health"]
      interval: 20s
      timeout: 5s
      retries: 3
    networks: [filmoteca-net]
    restart: unless-stopped

networks:
  filmoteca-net:
    name: filmoteca-net
    driver: bridge
    enable_ipv6: false
  npm-net:
    external: true
    name: npm-net
