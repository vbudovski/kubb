import type { Customer } from '../models/Customer.ts'
import { createAddress } from './createAddress.ts'
import { faker } from '@faker-js/faker'

export function createCustomer(data?: Partial<Customer>): Partial<Customer> {
  return {
    ...{ id: faker.number.int(), username: faker.string.alpha(), address: faker.helpers.multiple(() => createAddress()) as any },
    ...(data || {}),
  }
}
