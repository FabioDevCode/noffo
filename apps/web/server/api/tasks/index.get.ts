import { and, inArray, isNull, eq } from 'drizzle-orm'
import { auth } from '~~/app/lib/auth'
import { db } from '~~/app/db'
import { taskStatus, tasks } from '~~/app/db/schema'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      shortDescription: tasks.shortDescription,
      description: tasks.description,
      customFields: tasks.customFields,
      status: tasks.status,
      dueDate: tasks.dueDate,
      remindAt: tasks.remindAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      completedAt: tasks.completedAt,
      archivedAt: tasks.archivedAt,
    })
    .from(tasks)
    .where(and(
      eq(tasks.userId, session.user.id),
      isNull(tasks.archivedAt),
      inArray(tasks.status, taskStatus.enumValues),
    ))
})
