# SubQuery for ChainBridge

## Running locally for development

### Up

Start the database in the background.

```console
# yarn compose:db -d
```

Start Indexer (`subql/node`) and Query Service (`subql/query`). Starting with `--no-deps` won't stop the database while stopping the indexer and query service.

```console
# yarn compose:up --no-deps
```

GraphQL endpoint and playground should be available now at `http://localhost:3100`.

### Down

Say `<Ctrl+C>` to your console should be able to stop the indexer and query service.

To stop the database running in the background:

```console
# yarn compose:down
```

To purge the existing data:

```console
# yarn compose:purge
```

## Deploying for production

TO-DO: WIP for Kubernetes production deployments.

## Indexed events

### FungibleTransfer

#### Event

`chainBridge::FungibleTransfer(ChainId, DepositNonce, ResourceId, U256, Vec<u8>)`

#### Reason

Indexing `FungibleTransfer` helps tracking outbound transfers to foreign chains. (e.g PHA tokens from Phala to Ethereum ERC-20)

### ProposalSucceeded

#### Event

`chainBridge::ProposalSucceeded(ChainId, DepositNonce)`

#### Reason

`ProposalSucceeded` events are deposited while the proposals are being executed.

Indexing `ProposalSucceeded` helps tracking inbound transfers from foreign chains. (e.g PHA tokens from ERC-20 to Phala)

#### Example query

```graphql
query {
  proposalSucceededEvents {
    nodes{
      depositNonce
      extrinsic
      sourceChainId
    }
  }
}
```
