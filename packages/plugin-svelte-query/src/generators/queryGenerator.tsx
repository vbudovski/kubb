import { Client } from '@kubb/plugin-client/components'
import { createReactGenerator } from '@kubb/plugin-oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, useApp } from '@kubb/react'
import { difference } from 'remeda'
import { Query, QueryKey, QueryOptions } from '../components'
import type { PluginSvelteQuery } from '../types'

export const queryGenerator = createReactGenerator<PluginSvelteQuery>({
  name: 'svelte-query',
  Operation({ options, operation }) {
    const {
      plugin: {
        options: { output },
      },
    } = useApp<PluginSvelteQuery>()
    const { getSchemas, getName, getFile } = useOperationManager()

    const isQuery = typeof options.query === 'boolean' ? true : options.query?.methods.some((method) => operation.method === method)
    const isMutation = difference(options.mutation ? options.mutation.methods : [], options.query ? options.query.methods : []).some(
      (method) => operation.method === method,
    )
    const importPath = options.query ? options.query.importPath : '@tanstack/svelte-query'

    const query = {
      name: getName(operation, { type: 'function', prefix: 'create' }),
      typeName: getName(operation, { type: 'type' }),
      file: getFile(operation, { prefix: 'create' }),
    }

    const client = {
      name: getName(operation, { type: 'function' }),
    }

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'QueryKey' }),
      typeName: getName(operation, { type: 'type', suffix: 'QueryKey' }),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      //todo remove type?
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const zod = {
      file: getFile(operation, { pluginKey: [pluginZodName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
    }

    if (!isQuery || isMutation) {
      return null
    }

    return (
      <File baseName={query.file.baseName} path={query.file.path} meta={query.file.meta} banner={output?.banner} footer={output?.footer}>
        {options.parser === 'zod' && <File.Import name={[zod.schemas.response.name]} root={query.file.path} path={zod.file.path} />}
        <File.Import name={'client'} path={options.client.importPath} />
        <File.Import name={['RequestConfig']} path={options.client.importPath} isTypeOnly />
        {options.client.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={options.client.importPath} isTypeOnly />}
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter(Boolean)}
          root={query.file.path}
          path={type.file.path}
          isTypeOnly
        />

        <QueryKey
          name={queryKey.name}
          typeName={queryKey.typeName}
          operation={operation}
          pathParamsType={options.pathParamsType}
          typeSchemas={type.schemas}
          paramsCasing={options.paramsCasing}
          transformer={options.queryKey}
        />

        <Client
          name={client.name}
          isExportable={false}
          isIndexable={false}
          baseURL={options.client.baseURL}
          operation={operation}
          typeSchemas={type.schemas}
          zodSchemas={zod.schemas}
          dataReturnType={options.client.dataReturnType}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          parser={options.parser}
        />
        <File.Import name={['queryOptions']} path={importPath} />
        <QueryOptions
          name={queryOptions.name}
          clientName={client.name}
          queryKeyName={queryKey.name}
          typeSchemas={type.schemas}
          paramsCasing={options.paramsCasing}
          paramsType={options.paramsType}
          pathParamsType={options.pathParamsType}
          dataReturnType={options.client.dataReturnType}
        />
        {options.query && (
          <>
            <File.Import name={['createQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'CreateBaseQueryOptions', 'CreateQueryResult']} path={importPath} isTypeOnly />
            <Query
              name={query.name}
              queryOptionsName={queryOptions.name}
              typeSchemas={type.schemas}
              pathParamsType={options.pathParamsType}
              operation={operation}
              paramsCasing={options.paramsCasing}
              paramsType={options.paramsType}
              dataReturnType={options.client.dataReturnType}
              queryKeyName={queryKey.name}
              queryKeyTypeName={queryKey.typeName}
            />
          </>
        )}
      </File>
    )
  },
})
