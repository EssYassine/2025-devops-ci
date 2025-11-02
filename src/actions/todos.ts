import { createServerFn } from '@tanstack/react-start';
import { db } from '../db';
import { todos, type NewTodo } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const NewTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

const TodoIdSchema = z.object({
  id: z.number()
});

const UpdateTodoSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required'),
});


// Get all todos
export const getTodos = createServerFn({
  method: 'GET',
}).handler(async () => {
  const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));
  return allTodos;
});

// Create a new todo
export const createTodo = createServerFn()
  .inputValidator(NewTodoSchema)
  .handler(async ({ data }) => {
    const { title } = data;
    const newTodo: NewTodo = {
      title,
      completed: false,
    };
    const [todo] = await db.insert(todos).values(newTodo).returning();
    console.log('[createTodo] Created todo:', JSON.stringify(todo, null, 2));
    return todo;
  });

// Toggle todo completion
export const toggleTodo = createServerFn()
  .inputValidator(TodoIdSchema)
  .handler(async ({ data }) => {
    const { id } = data;

    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    if (!todo) {
      throw new Error('Todo not found');
    }
    const [updatedTodo] = await db
      .update(todos)
      .set({ completed: !todo.completed })
      .where(eq(todos.id, id))
      .returning();
    return updatedTodo;
  });

// Delete a todo
export const deleteTodo = createServerFn()
  .inputValidator(TodoIdSchema)
  .handler(async ({ data }) => {
    const { id } = data
    await db.delete(todos).where(eq(todos.id, id));
    return { success: true };
  });


// Update todo title
export const updateTodoTitle = createServerFn()
  .inputValidator(UpdateTodoSchema)
  .handler(async ({ data }) => {
    const { id, title } = data;
    const [updatedTodo] = await db
      .update(todos)
      .set({ title })
      .where(eq(todos.id, id))
      .returning();
    return updatedTodo;
  });
