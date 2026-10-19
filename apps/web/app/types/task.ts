import type { InferSelectModel } from 'drizzle-orm'
import type { tasks } from '~/db/schema'

type DatabaseTask = InferSelectModel<typeof tasks>

type SerializedDateFields = 'createdAt' | 'updatedAt' | 'completedAt' | 'archivedAt'

/** Authenticated API task shape with timestamps in their JSON-serialized form. */
export type Task = Omit<DatabaseTask, 'userId' | SerializedDateFields> & {
  createdAt: string
  updatedAt: string
  completedAt: string | null
  archivedAt: string | null
}

export type TaskStatus = Task['status']
