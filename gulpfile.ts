import { typesChain } from '@phala/typedefs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { OverrideBundleType, RegistryTypes } from '@polkadot/types/types'
import { config as configureDotEnv } from 'dotenv'
import execa from 'execa'
import { readFile, stat, writeFile } from 'fs/promises'
import { series } from 'gulp'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { resolve } from 'path'

configureDotEnv()

const DEFAULT_NETWORK_ENDPOINT = 'wss://khala-api.phala.network/ws'

const startBlockEnv = process.env['START_BLOCK']

const endpoint = process.env['NETWORK_ENDPOINT'] ?? DEFAULT_NETWORK_ENDPOINT
const startBlock = /^\d+$/.test(startBlockEnv) ? parseInt(startBlockEnv) : undefined

interface Project {
    dataSources?: [{ startBlock?: number }]
    network?: {
        endpoint?: string
        typesBundle?: OverrideBundleType
        typesChain?: Record<string, RegistryTypes>
    }
}

const tryLoadTypesBundle = (async (): Promise<OverrideBundleType | undefined> => {
    try {
        const bundleStat = await stat(resolve(__dirname, 'typesBundle.ts'))
        if (bundleStat.isFile()) {
            return require('./typesBundle').typesBundle
        } else {
            throw new Error('typesBundle.ts is not a file')
        }
    } catch (error) {
        console.error('Failed to import "typesBundle.ts":', error)
    }
})()

export const configure = async (): Promise<void> => {
    console.info('Configuring project using chain endpoint:', endpoint)

    const project = yaml.load((await readFile(resolve(__dirname, 'project.template.yaml'))).toString()) as Project

    // set startBlock from environment variable

    if (project.dataSources instanceof Array && typeof startBlock === 'number') {
        project.dataSources.forEach((dataSource) => {
            dataSource.startBlock = startBlock
        })
    }

    // configure typedefs and node endpoint

    const typesBundle = await tryLoadTypesBundle

    project.network = {
        ...project.network,
        endpoint,
    }

    if (typesBundle !== undefined) {
        project.network.typesBundle = typesBundle
    } else {
        project.network.typesChain = typesChain
    }

    // write project.yaml

    await writeFile(
        resolve(__dirname, 'project.yaml'),
        yaml.dump(project, {
            lineWidth: -1,
            noRefs: true,
            schema: JSON_SCHEMA,
        })
    )
}

export const codegen = async (): Promise<void> => {
    await execa('npx', ['subql', 'codegen', '--file', resolve(__dirname, 'project.json')])
}

export const typegenFromDefinitions = async (): Promise<void> => {
    const typesBundle = await tryLoadTypesBundle

    const provider = new WsProvider(endpoint)
    const api = await ApiPromise.create({ provider, typesBundle, typesChain })
    const chain = (await api.rpc.system.chain()).toString()
    await provider.disconnect()

    console.info(`Generating type definition, chain=${chain}, reflect_endpoint=${endpoint}`)

    const definitions = `
        import { typesChain } from '@phala/typedefs'

        export default {
            types: typesChain['${chain}']
        }
    `

    await writeFile(resolve(__dirname, 'src', 'interfaces', 'phala', 'definitions.ts'), definitions)
    await execa(
        'ts-node',
        [
            '--skip-project',
            'node_modules/@polkadot/typegen/scripts/polkadot-types-from-defs.cjs',
            '--package',
            '.',
            '--input',
            './src/interfaces',
        ],
        {
            stdio: 'inherit',
        }
    )
}

export const typegenFromMetadata = async (): Promise<void> => {
    console.info('Generating from metadata using endpoint:', endpoint)

    await execa(
        'ts-node',
        [
            '--skip-project',
            'node_modules/@polkadot/typegen/scripts/polkadot-types-from-chain.cjs',
            '--package',
            '.',
            '--output',
            './src/interfaces',
            '--endpoint',
            endpoint,
        ],
        {
            stdio: 'inherit',
        }
    )
}

export const typegen = series(typegenFromDefinitions, typegenFromMetadata)

export const typescript = async (): Promise<void> => {
    await execa('npx', ['tsc', '--build'])
}

export const docker = series(configure, codegen, typegen, typescript)
