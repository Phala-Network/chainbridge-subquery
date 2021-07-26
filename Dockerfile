FROM onfinality/subql-node:latest

ARG PHALA_NODE

WORKDIR /app

COPY . .

RUN set -ex \
    && yarn \
    && yarn codegen \
    && yarn typegen:from-defs \
    && yarn typegen:from-chain ${PHALA_NODE} \
    && yarn build

# ENTRYPOINT, CMD, etc., stay unchanged as onfinality/subql-node
