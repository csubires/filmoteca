FROM alpine:3.18
RUN apk update && apk add --no-cache mariadb mariadb-client bash
RUN rm -rf /var/cache/apk/*
COPY tools/entrypoint.sh /tmp/entrypoint.sh
COPY ./conf/50-server.cnf /etc/mysql/mariadb.conf.d/
RUN chmod +x /tmp/entrypoint.sh && \
    mkdir -p /run/mysqld /var/lib/mysql && \
    chown -R mysql:mysql /var/lib/mysql /run/mysqld
CMD ["/tmp/entrypoint.sh"]
