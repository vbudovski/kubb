import type { GetInventory200, GetInventoryQueryResponse } from '../../models/GetInventory.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createGetInventory200(data?: Partial<GetInventory200>): Partial<GetInventory200> {
  faker.seed([220])
  return {
    ...{},
    ...(data || {}),
  }
}

export function createGetInventoryQueryResponse(data?: Partial<GetInventoryQueryResponse>): Partial<GetInventoryQueryResponse> {
  faker.seed([220])
  return data || faker.helpers.arrayElement<any>([createGetInventory200()])
}
