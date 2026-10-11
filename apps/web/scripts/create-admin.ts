import * as readline from 'node:readline'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'

// Must run before dynamic imports so that the pg Pool is created with the correct DATABASE_URL.
// process.loadEnvFile is available in Node ≥21.7 (we require Node ≥20 via the workspace).
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  process.loadEnvFile(resolve(__dirname, '../.env'))
} catch {
  // No .env file — env vars are expected to be set externally (CI, production, etc.)
}

// Dynamic imports guarantee that pg Pool is initialised after env is loaded.
// Note: auth.ts is NOT imported — disableSignUp: true would also block auth.api.signUpEmail().
// The user is inserted directly using the same hashPassword function Better Auth uses internally.
const { db } = await import('../app/db/index.js')
const { user, account } = await import('../app/db/auth-schema.js')
const { hashPassword } = await import('better-auth/crypto')

// Fixed advisory lock key that identifies this specific operation in PostgreSQL.
// pg_advisory_lock is blocking and session-scoped: released automatically on pool end.
const ADVISORY_LOCK_KEY = 5_879_983

// ---------------------------------------------------------------------------
// Interactive input helpers
// ---------------------------------------------------------------------------

function readLine(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

/** Reads a line from stdin without echoing characters (password input). */
function readSecret(prompt: string): Promise<string> {
  process.stdout.write(prompt)

  return new Promise((resolve, reject) => {
    const chars: string[] = []

    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const onData = (char: string) => {
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(chars.join(''))
      } else if (char === '\u0003') {
        // Ctrl+C
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        reject(new Error('Interrupted'))
      } else if (char === '\u007F' || char === '\b') {
        // Backspace / Delete — erase the last * from the display
        if (chars.pop() !== undefined) {
          process.stdout.write('\b \b')
        }
      } else {
        chars.push(char)
        process.stdout.write('*')
      }
    }

    process.stdin.on('data', onData)
  })
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Acquire a blocking advisory lock so that two concurrent invocations cannot
  // both pass the "no users exist" check and each create an admin account.
  await db.execute(sql`SELECT pg_advisory_lock(${ADVISORY_LOCK_KEY})`)

  const existing = await db.select({ id: user.id }).from(user).limit(1)
  if (existing.length > 0) {
    console.error('An admin user already exists. No action taken.')
    process.exitCode = 1
    return
  }

  console.log('No users found. Please provide details for the first admin account.\n')

  // Name — optional
  const name = await readLine('Name (optional, press Enter to skip): ')

  // Email — required and validated
  let email = ''
  while (!email) {
    const input = await readLine('Email (required): ')
    if (!isValidEmail(input)) {
      console.error('  Invalid email address. Please try again.')
    } else {
      email = input
    }
  }

  // Password — required, masked; must be confirmed
  let password = ''
  while (!password) {
    const pwd = await readSecret('Password (required): ')
    if (!pwd) {
      console.error('  Password cannot be empty. Please try again.')
      continue
    }
    const confirm = await readSecret('Confirm password: ')
    if (pwd !== confirm) {
      console.error('  Passwords do not match. Please try again.')
      continue
    }
    password = pwd
  }

  // Better Auth requires a non-empty name; fall back to the email local-part.
  const effectiveName = name || email.split('@')[0]!

  // Insert the user directly, using the same password hash function Better Auth uses.
  // auth.api.signUpEmail() cannot be used because disableSignUp: true is set in auth.ts,
  // which would block the call even when made internally (not through HTTP).
  const hashedPassword = await hashPassword(password)
  const now = new Date()
  const userId = randomUUID()

  await db.insert(user).values({
    id: userId,
    name: effectiveName,
    email: email.toLowerCase(),
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  })

  console.log(`\nUser "${effectiveName}" <${email}> created successfully.`)
}

main()
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\nError: ${message}`)
    process.exitCode = 1
  })
  .finally(() => db.$client.end())
