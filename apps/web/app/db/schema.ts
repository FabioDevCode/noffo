import { user } from './auth-schema'
import {
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const taskStatus = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
])

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  customFields: jsonb('custom_fields').notNull().default([]),
  status: taskStatus('status').notNull().default('pending'),
  dueDate: date('due_date', { mode: 'string' }),
  remindAt: date('remind_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
})
