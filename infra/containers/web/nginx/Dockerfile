FROM docker.io/library/nginx:stable

USER root

# Install required packages on Debian-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /etc/nginx/ssl /var/log/nginx \
  && rm -f /etc/nginx/conf.d/default.conf \
  && openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/private-key.pem \
    -out /etc/nginx/ssl/certificate.pem \
    -days 365 \
    -subj "/CN=localhost"

COPY infra/containers/web/nginx/00-log-formats.conf /etc/nginx/conf.d/00-log-formats.conf
COPY infra/containers/web/nginx/proxy-headers.conf /etc/nginx/conf.d/proxy-headers.conf
COPY infra/containers/web/nginx/00-nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
