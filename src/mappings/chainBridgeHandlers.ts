import { Bytes, U256 } from '@polkadot/types'
import { IEvent } from '@polkadot/types/types'
import { SubstrateEvent } from '@subql/types'
import { BridgeChainId, DepositNonce, ResourceId } from '../interfaces'
import { ChainBridgeFungibleTransferEvent, ChainBridgeProposalApproval, ChainBridgeProposalExecution } from '../types'

export async function handleFungibleTransferEvent(ctx: SubstrateEvent): Promise<void> {
    const {
        data: [chainIdCodec, depositNonceCodec, resourceId, amount, recipient],
    } = ctx.event as unknown as IEvent<[BridgeChainId, DepositNonce, ResourceId, U256, Bytes]>

    const chainId = chainIdCodec.toNumber()
    const depositNonce = depositNonceCodec.toBigInt()

    const id = `${chainId}-${depositNonce}`

    if (undefined === (await ChainBridgeFungibleTransferEvent.get(id))) {
        const record = new ChainBridgeFungibleTransferEvent(id)
        record.amount = amount.toString()
        record.depositNonce = depositNonce
        record.destinationChainId = chainId
        record.executedAt = ctx.extrinsic?.extrinsic.hash.toHex()
        record.recipient = recipient.toHex()
        record.resourceId = resourceId.toHex()
        record.signer = ctx.extrinsic?.extrinsic.signer.toString()
        await record.save()
    }
}

export async function handleProposalApprovedEvent(ctx: SubstrateEvent): Promise<void> {
    const {
        data: [chainIdCodec, depositNonceCodec],
    } = ctx.event as unknown as IEvent<[BridgeChainId, DepositNonce]>

    const originChainId = chainIdCodec.toNumber()
    const depositNonce = depositNonceCodec.toBigInt()

    const id = `${originChainId}-${depositNonce}`
    let record = await ChainBridgeProposalApproval.get(id)
    if (record === undefined) {
        record = new ChainBridgeProposalApproval(id)
        record.depositNonce = depositNonce
        record.originChainId = originChainId
    }

    record.approvalBlockHeight = ctx.block.block.header.number.toBigInt()
    record.approvalExtrinsic = ctx.extrinsic.extrinsic.hash.toString()
    record.signer = ctx.extrinsic.extrinsic.signer.toString()
    await record.save()
}

export async function handleProposalSucceededEvent(ctx: SubstrateEvent): Promise<void> {
    const {
        data: [chainIdCodec, depositNonceCodec],
    } = ctx.event as unknown as IEvent<[BridgeChainId, DepositNonce]>

    const originChainId = chainIdCodec.toNumber()
    const depositNonce = depositNonceCodec.toBigInt()

    const id = `${originChainId}-${depositNonce}`
    let record = await ChainBridgeProposalExecution.get(id)
    if (record === undefined) {
        record = new ChainBridgeProposalExecution(id)
        record.depositNonce = depositNonce
        record.originChainId = originChainId
    }

    record.signer = ctx.extrinsic.extrinsic.signer.toString()
    await record.save()
}
