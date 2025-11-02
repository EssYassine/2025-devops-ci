import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react'
import { getTodos, createTodo, toggleTodo, deleteTodo } from '../actions/todos'
import { type Todo } from '../db/schema'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const todos = await getTodos()
    return { todos }
  },
})

function App() {
  const { todos: initialTodos } = Route.useLoaderData()

  const createTodoFn = useServerFn(createTodo)
  const toggleTodoFn = useServerFn(toggleTodo)
  const deleteTodoFn = useServerFn(deleteTodo)
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    setIsAdding(true)
    try {
      const newTodo = await createTodoFn({
        data: {
          title: newTodoTitle.trim(),
        }
      })

      setTodos([newTodo, ...todos])
      setNewTodoTitle('')
    } catch (error) {
      console.error('Failed to create todo:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTodo = async (id: number) => {
    try {
      const updatedTodo = await toggleTodoFn({ data: { id } })
      setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)))
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodoFn({ data: { id } })
      setTodos(todos.filter((todo) => todo.id !== id))
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Todo App
            </span>
          </h1>
          <p className="text-gray-400">
            Built with TanStack Start, React, Tailwind & Drizzle
          </p>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={handleAddTodo} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={isAdding}
            />
            <button
              type="submit"
              disabled={isAdding || !newTodoTitle.trim()}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="flex gap-4 mb-6 text-sm text-gray-400">
          <div>
            <span className="font-semibold text-cyan-400">{activeTodos.length}</span>{' '}
            active
          </div>
          <div>
            <span className="font-semibold text-green-400">{completedTodos.length}</span>{' '}
            completed
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No todos yet. Add one above to get started!
            </div>
          ) : (
            <>
              {/* Active Todos */}
              {activeTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <Circle className="w-6 h-6" />
                    </button>
                    <span className="flex-1 text-white">{todo.title}</span>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="flex-shrink-0 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Completed Todos */}
              {completedTodos.length > 0 && (
                <div className="pt-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Completed
                  </h2>
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 mb-3 hover:border-green-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTodo(todo.id)}
                          className="flex-shrink-0 text-green-400 hover:text-gray-400 transition-colors"
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </button>
                        <span className="flex-1 text-gray-500 line-through">
                          {todo.title}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="flex-shrink-0 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
