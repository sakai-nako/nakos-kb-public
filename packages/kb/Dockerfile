FROM ghcr.io/static-web-server/static-web-server:2.44.0
COPY --chown=10001:10001 dist/ /public/
ENV SERVER_HOST=0.0.0.0 SERVER_PORT=8080 SERVER_ROOT=/public/ SERVER_HEALTH=true
USER 10001:10001
EXPOSE 8080
