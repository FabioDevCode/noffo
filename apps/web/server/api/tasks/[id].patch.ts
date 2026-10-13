import { and, eq, inArray, isNull } from 'drizzle-orm'
import { auth } from '~~/app/lib/auth'
import { db } from '~~/app/db'
import { tasks } from '~~/app/db/schema'

type TaskStatusUpdate = {
  status: 'in_progress' | 'completed'
}

function isTaskStatusUpdate(body: unknown): body is TaskStatusUpdate {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return false
  }

  const value = body as Record<string, unknown>

  return Object.keys(value).length === 1
    && (value.status === 'in_progress' || value.status === 'completed')
}

function isUuid(value: string | undefined): value is string {
  return value !== undefined
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const taskId = getRouterParam(event, 'id')

  if (!isUuid(taskId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task ID',
    })
  }

  const body: unknown = await readBody(event)

  if (!isTaskStatusUpdate(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task status',
    })
  }

  const [task] = await db
    .select({
      status: tasks.status,
      archivedAt: tasks.archivedAt,
    })
    .from(tasks)
    .where(and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id),
    ))
    .limit(1)

  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found',
    })
  }

  if (task.archivedAt || task.status === 'completed') {
    throw createError({
      statusCode: 409,
      statusMessage: 'This task can no longer be changed',
    })
  }

  const allowedCurrentStatuses = body.status === 'in_progress'
    ? ['pending'] as const
    : ['pending', 'in_progress'] as const
  const updatedAt = new Date()

  const updates = body.status === 'completed'
    ? { status: body.status, completedAt: updatedAt, updatedAt }
    : { status: body.status, updatedAt }

  const [updatedTask] = await db
    .update(tasks)
    .set(updates)
    .where(and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id),
      isNull(tasks.archivedAt),
      inArray(tasks.status, allowedCurrentStatuses),
    ))
    .returning({
      id: tasks.id,
      status: tasks.status,
    })

  if (!updatedTask) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This task can no longer be changed',
    })
  }

  return updatedTask
})
