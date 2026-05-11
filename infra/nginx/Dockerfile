FROM alpine:3.18
RUN apk update && apk add --no-cache nginx openssl
RUN rm -rf /var/cache/apk/*
RUN mkdir -p /var/www/html /etc/ssl/private && \
    chmod -R 755 /var/www/html && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/nginx.key \
        -out /etc/ssl/private/nginx.crt \
        -subj "/CN=csubires.42.fr"
COPY conf/nginx.conf /etc/nginx/nginx.conf
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
