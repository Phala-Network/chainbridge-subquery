import { IEvent } from '@polkadot/types/types'
import { SubstrateEvent } from '@subql/types'
import { ChainId, DepositNonce } from '../interfaces'
import { ProposalSucceededEvent } from '../types'

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
