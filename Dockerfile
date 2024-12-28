FROM node:lts-alpine3.19

COPY ./artifacts /artifacts

WORKDIR /app

RUN cp /artifacts/selfsigned.* /etc && npm i -E --no-audit --no-fund /artifacts/*.tgz && npm cache clean --force && rm -rf /artifacts

WORKDIR /app/pwd

ENV NODE_ENV=production

ENTRYPOINT ["npx", "-c", "runtime-host-node"]