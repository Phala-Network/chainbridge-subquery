import { config as configureDotEnv } from 'dotenv'
import execa from 'execa'
import { readFile, writeFile } from 'fs/promises'
import { series } from 'gulp'
import yaml from 'js-yaml'
import { resolve } from 'path'

configureDotEnv()

const DEFAULT_NETWORK_ENDPOINT = 'wss://khala.phala.network/ws'
const DEFAULT_NETWORK_TYPEDEFS = 'khala'

const endpoint = process.env['NETWORK_ENDPOINT'] ?? DEFAULT_NETWORK_ENDPOINT
const typedefsRef = process.env['NETWORK_TYPEDEFS'] ?? DEFAULT_NETWORK_TYPEDEFS

interface Project {
    network?: {
        endpoint?: string
        typedefs?: unknown
    }
}

export const configure = async (): Promise<void> => {
    console.info('Using typedefs name:', typedefsRef)

    const template = yaml.load((await readFile(resolve(__dirname, 'project.template.yaml'))).toString()) as Project

    const registry = await import('@phala/typedefs')
    const types = registry[typedefsRef] as unknown

    const network = {
        ...template.network,
        endpoint,
        types,
    }

    const project = {
        ...template,
        network,
    }

    await writeFile(resolve(__dirname, 'project.yaml'), yaml.dump(project))
}

export const codegen = async (): Promise<void> => {
    await execa('npx', ['subql', 'codegen'])
}

export const typegenFromDefinitions = async (): Promise<void> => {
    const definitions = `
        import { ${typedefsRef} } from '@phala/typedefs'
        export default {
            types: ${typedefsRef}
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
    console.info('Using endpoint:', endpoint)

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
