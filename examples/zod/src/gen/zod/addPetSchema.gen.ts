import { z } from '../../zod.ts'
import { addPetRequestSchema } from './addPetRequestSchema.gen.ts'
import { petSchema } from './petSchema.gen.ts'

/**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema)

export type AddPet200Schema = z.infer<typeof addPet200Schema>

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({
  code: z.number().int().optional(),
  message: z.string().optional(),
})

export type AddPet405Schema = z.infer<typeof addPet405Schema>

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema)

export type AddPetMutationRequestSchema = z.infer<typeof addPetMutationRequestSchema>

export const addPetMutationResponseSchema = z.lazy(() => addPet200Schema)

export type AddPetMutationResponseSchema = z.infer<typeof addPetMutationResponseSchema>
