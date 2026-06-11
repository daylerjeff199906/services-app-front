import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function TodosPage() {
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    async function getTodos() {
      const { data: todos } = await supabase.from('todos').select()

      if (todos) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Todos (Supabase Integration)</h1>
      <ul className="list-disc pl-5 text-foreground space-y-2">
        {todos.length === 0 ? (
          <li className="text-muted-foreground">No todos found or loading...</li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id}>{todo.name}</li>
          ))
        )}
      </ul>
    </div>
  )
}
