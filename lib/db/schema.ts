import {
  timestamp,
  pgTable as table,
  text,
  // primaryKey,
  // integer,
  uuid,
  // boolean,
  pgEnum,
  varchar,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'completed']);

// Users table
export const users = table(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(), 
    name: varchar('name', { length: 255 }).notNull(),
    password: text('password').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return{
    emailIndex: index('users_email_idx').on(table.email), // indexing email for faster lookups
  }}
);

// Projects table
export const projects = table(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('projects_user_id_idx').on(table.userId),
    nameIndex: index('projects_name_idx').on(table.name),
    createdAtIndex: index('projects_created_at_idx').on(table.createdAt), 
    uniqueNamePerUser: uniqueIndex('projects_name_user_unique_idx').on(table.name, table.userId),
  })
);

// Categories table
export const categories = table(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 10 }) , // limit color length to save space
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('categories_user_id_idx').on(table.userId),
    uniqueNamePerUser: uniqueIndex('categories_name_user_unique_idx').on(table.name, table.userId),
  })
);


// Category Assignments table ( Many-to-Many || Junction Table )
export const categoryAssignments = table(
  'category_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'set null' }),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
    // projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('category_assignments_category_idx').on(table.categoryId),
    taskIdx: index('category_assignments_task_idx').on(table.taskId),
    uniqueAssignment: uniqueIndex('unique_category_task_idx').on(table.categoryId, table.taskId), 
  })
);

// Tasks table
export const tasks = table(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    status: taskStatusEnum('status').notNull().default('todo'),
    dueDate: timestamp('due_date'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    // categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('tasks_user_id_idx').on(table.userId),
    projectIdIndex: index('tasks_project_id_idx').on(table.projectId),
    titleIndex: index('tasks_title_idx').on(table.title),
    dueDateIndex: index('tasks_due_date_idx').on(table.dueDate), 
    uniqueTitlePerUser: uniqueIndex('tasks_title_user_unique_idx').on(table.title, table.userId),
    // categoryIdIndex: index('tasks_category_id_idx').on(table.categoryId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
  categories: many(categories),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  assignments: many(categoryAssignments),
}));

export const categoryAssignmentsRelations = relations(categoryAssignments, ({ one }) => ({
  category: one(categories, { fields: [categoryAssignments.categoryId], references: [categories.id] }),
  task: one(tasks, { fields: [categoryAssignments.taskId], references: [tasks.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  categories: many(categoryAssignments), 
}));

