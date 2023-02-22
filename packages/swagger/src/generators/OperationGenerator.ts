import { capitalCase } from 'change-case'

import type { FileManager, File } from '@kubb/core'
import { Generator } from '@kubb/core'

import type { Operation } from 'oas'
import type { MediaTypeObject, RequestBodyObject } from 'oas/dist/rmoas.types'
import type { OpenAPIV3 } from 'openapi-types'
import type Oas from 'oas'

type OperationSchema = {
  name: string
  description?: string
  schema: OpenAPIV3.SchemaObject
}
export type OperationSchemas = {
  pathParams?: OperationSchema
  queryParams?: OperationSchema
  request: OperationSchema
  response: OperationSchema
}

export abstract class OperationGenerator<TOptions extends object = object> extends Generator<TOptions> {
  private getParametersSchema(operation: Operation, inKey: 'path' | 'query') {
    const params = operation.getParameters().filter((v) => v.in === inKey)
    return params.reduce(
      (schema, pathParameters) => {
        return {
          ...schema,
          required: [...schema.required!, pathParameters.required ? pathParameters.name : undefined].filter(Boolean) as string[],
          properties: {
            ...schema.properties,
            [pathParameters.name]: pathParameters.schema as OpenAPIV3.SchemaObject,
          },
        }
      },
      { type: 'object', required: [], properties: {} } as OpenAPIV3.SchemaObject
    )
  }

  getSchemas(operation: Operation): OperationSchemas {
    return {
      pathParams: operation.hasParameters()
        ? {
            name: capitalCase(`${operation.getOperationId()} "PathParams"`, { delimiter: '' }),
            schema: this.getParametersSchema(operation, 'path'),
          }
        : undefined,
      queryParams: operation.hasParameters()
        ? {
            name: capitalCase(`${operation.getOperationId()} "QueryParams"`, { delimiter: '' }),
            schema: this.getParametersSchema(operation, 'query'),
          }
        : undefined,
      request: {
        name: capitalCase(`${operation.getOperationId()} "Request"`, { delimiter: '' }),
        description: (operation.schema.requestBody as RequestBodyObject)?.description,
        schema: (operation.getRequestBody('application/json') as MediaTypeObject)?.schema as OpenAPIV3.SchemaObject,
      },
      response: {
        name: capitalCase(`${operation.getOperationId()} "Response"`, { delimiter: '' }),
        description: operation.getResponseAsJSONSchema('200')?.at(0)?.description,
        schema: operation.getResponseAsJSONSchema('200')?.at(0)?.schema as OpenAPIV3.SchemaObject,
      },
    }
  }

  getComments(operation: Operation) {
    return [
      operation.getDescription() && `@description ${operation.getDescription()}`,
      operation.getSummary() && `@summary ${operation.getSummary()}`,
      operation.path && `@link ${operation.path}`,
    ].filter(Boolean)
  }

  async buildOperations(options: { oas: Oas; fileManager: FileManager }) {
    const { oas, fileManager } = options
    const paths = oas.getPaths()

    const promises = Object.keys(paths).reduce((acc, path) => {
      acc.push(this.getGet(path))
      acc.push(this.getPost(path))
      acc.push(this.getPut(path))
      acc.push(this.getDelete(path))

      return acc
    }, [] as Promise<File | null>[])

    const files = await Promise.all(promises)

    const filePromises = fileManager.combine(files).reduce((acc, file) => {
      acc.push(fileManager.addOrAppend(file))
      return acc
    }, [] as Promise<File>[])

    return Promise.all(filePromises)
  }

  abstract getGet(path: string): Promise<File | null>

  abstract getPost(path: string): Promise<File | null>

  abstract getPut(path: string): Promise<File | null>

  abstract getDelete(path: string): Promise<File | null>
}
