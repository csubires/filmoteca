FROM base AS frontend-build
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build


FROM owasp/modsecurity-crs:4.20-nginx-alpine-202511100111

USER root
RUN mkdir -p /var/log/nginx /var/log /etc/nginx/ssl /etc/nginx/conf

# Generate SSL certificates at build time
RUN apk add --no-cache openssl && \
    cd /etc/nginx/conf && \
    openssl genrsa -out private-key.pem 2048 && \
    openssl req -new -x509 -key private-key.pem -out certificate.pem -days 365 \
        -subj "/C=ES/ST=Madrid/L=Madrid/O=Production/CN=localhost" && \
    openssl pkcs12 -export -out certificate.pfx -inkey private-key.pem -in certificate.pem -passout pass: && \
    chmod 644 certificate.pem certificate.pfx && \
    chmod 600 private-key.pem

COPY nginx/modsecurity/modsecurity-override.conf \
  /etc/nginx/templates/modsecurity.d/modsecurity-override.conf.template

COPY nginx/proxy-headers.conf /etc/nginx/conf.d/proxy-headers.conf
COPY nginx/00-log-formats.conf /etc/nginx/conf.d/00-log-formats.conf
COPY nginx/00-nginx.conf /etc/nginx/conf.d/00-nginx.conf

COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY --from=frontend-build /app/index.html /usr/share/nginx/html/
COPY --from=frontend-build /app/decode.html /usr/share/nginx/html/
COPY --from=frontend-build /app/output.css /usr/share/nginx/html/
COPY --from=frontend-build /app/styles.css /usr/share/nginx/html/
COPY --from=frontend-build /app/icon.png /usr/share/nginx/html/
COPY --from=frontend-build /app/default-avatar.png /usr/share/nginx/html/
COPY --from=frontend-build /app/avatars /usr/share/nginx/html/avatars

CMD ["nginx", "-g", "daemon off;"]
