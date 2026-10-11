
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'

import { db } from '../db'

type AuthOptions = {
  disableSignUp?: boolean
  autoSignIn?: boolean
}

export function createAuth({
  disableSignUp = true,
  autoSignIn = true,
}: AuthOptions = {}) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp,
      autoSignIn,
    },
  })
}

export const auth = createAuth()
