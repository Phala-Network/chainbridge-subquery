FROM onfinality/subql-node:latest

ARG NETWORK_ENDPOINT
ARG NETWORK_TYPEDEFS
ARG NPM_CONFIG_REGISTRY

WORKDIR /app

COPY \
    package.json \
    yarn.lock \
    /app/

RUN set -ex \
    && yarn

COPY \
    docker/docker-entrypoint.sh \
    gulpfile.ts \
    src \
    project.template.yaml \
    schema.graphql \
    tsconfig.json \
    /app/
COPY ./src /app/src

RUN set -ex \
    && mkdir -p /app/src/interfaces/phala/ \
    && npx gulp docker \
    && chmod +x /app/docker-entrypoint.sh 

ENTRYPOINT [ "/sbin/tini", "--", "/app/docker-entrypoint.sh", "subql-node" ]

CMD [ "-f" ,"/app" ]
