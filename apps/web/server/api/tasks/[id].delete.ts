import { and, eq } from 'drizzle-orm'
import { auth } from '~~/app/lib/auth'
import { db } from '~~/app/db'
import { tasks } from '~~/app/db/schema'

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

  const [deletedTask] = await db
    .delete(tasks)
    .where(and(
      eq(tasks.id, taskId),
      eq(tasks.userId, session.user.id),
    ))
    .returning({ id: tasks.id })

  if (!deletedTask) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found',
    })
  }

  return { id: deletedTask.id }
})
