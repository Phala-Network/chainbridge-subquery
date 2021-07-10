import { Bytes, U256 } from '@polkadot/types'
import { IEvent } from '@polkadot/types/types'
import { SubstrateEvent } from '@subql/types'
import { ChainId, DepositNonce, ResourceId } from '../interfaces'
import { FungibleTransferEvent, ProposalSucceededEvent } from '../types'

export async function handleFungibleTransferEvent(ctx: SubstrateEvent): Promise<void> {
    const {
        data: [chainIdCodec, depositNonceCodec, resourceId, amount, recipient],
    } = ctx.event as unknown as IEvent<[ChainId, DepositNonce, ResourceId, U256, Bytes]>

    const chainId = chainIdCodec.toNumber()
    const depositNonce = depositNonceCodec.toBigInt()

    const id = `${chainId}-${depositNonce}`

    if (undefined === (await FungibleTransferEvent.get(id))) {
        const record = new FungibleTransferEvent(id)
        record.amount = amount.toString()
        record.depositNonce = depositNonce
        record.destinationChainId = chainId
        record.recipient = recipient.toHex()
        record.resourceId = resourceId.toHex()
        await record.save()
    }
}

export async function handleProposalSucceededEvent(ctx: SubstrateEvent): Promise<void> {
    const {
        data: [chainIdCodec, depositNonceCodec],
    } = ctx.event as unknown as IEvent<[ChainId, DepositNonce]>

    const chainId = chainIdCodec.toNumber()
    const depositNonce = depositNonceCodec.toBigInt()

    const id = `${chainId}-${depositNonce}`

    if (undefined === (await ProposalSucceededEvent.get(id))) {
        const record = new ProposalSucceededEvent(id)
        record.depositNonce = depositNonce
        record.extrinsic = ctx.extrinsic?.extrinsic.hash.toHex()
        record.sourceChainId = chainId
        await record.save()
    }
}
