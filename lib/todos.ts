// Your file to implement.
// See decisions/002_supabase_schema.md for the todos table schema.
//
// Functions to export:
//   addTodo(title, category, options?) — options: parent_id, planned_before, planned_after
//   completeTodo(id)
//   listTodos(category?) — filter by category, exclude completed, respect planned_after
//   updateTodo(id, fields) — partial update
//   deleteTodo(id) — cascade handles subtasks
//
// Use sql from './db.js' — see log.ts or preferences.ts for examples.

import sql from './db.js'

export async function addTodo(                                                                    
title: string,                                                                                  
category: string,                                                                               
options?: {                                                                                     
    parent_id?: string
    planned_before?: string                                                                       
    planned_after?: string
}
) {
const [todo] = await sql`
    INSERT INTO todos (title, category, parent_id, planned_before, planned_after)
    VALUES (                                                                                      
    ${title},
    ${category},                                                                                
    ${options?.parent_id ?? null},
    ${options?.planned_before ?? null},
    ${options?.planned_after ?? null}
    )
    RETURNING *
`
return todo
}