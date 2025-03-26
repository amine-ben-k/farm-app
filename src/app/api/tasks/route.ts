import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import moment from 'moment';

// Define the Task type based on your database schema
interface Task {
  id: number;
  title: string;
  description: string | null;
  task_date: Date; // This is a Date object from pg
  time: string | null;
  status: 'Pending' | 'Done' | 'Postponed';
  recurrence: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  created_at: Date;
  updated_at: Date;
}

export async function GET() {
  try {
    const client = await pool.connect();

    const tasksResult = await client.query('SELECT * FROM tasks ORDER BY task_date');
    const tasks = tasksResult.rows.map((task: Task) => {
      // Extract the date components without timezone conversion
      const taskDate = new Date(task.task_date);
      const year = taskDate.getFullYear();
      const month = String(taskDate.getMonth() + 1).padStart(2, '0'); // Months are 0-11
      const day = String(taskDate.getDate()).padStart(2, '0');
      const formattedTaskDate = `${year}-${month}-${day}`;

      return {
        ...task,
        task_date: formattedTaskDate, // Use local date components
        created_at: task.created_at.toISOString(),
        updated_at: task.updated_at.toISOString(),
      };
    });

    client.release();

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const { title, description, task_date, time, recurrence } = await request.json();

    if (!title || !task_date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const validRecurrences = ['None', 'Daily', 'Weekly', 'Monthly'];
    if (recurrence && !validRecurrences.includes(recurrence)) {
      return NextResponse.json(
        { error: `Invalid recurrence. Must be one of: ${validRecurrences.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    await client.query(
      'INSERT INTO tasks (title, description, task_date, time, status, recurrence) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description || null, task_date, time || null, 'Pending', recurrence || 'None']
    );

    client.release();

    return NextResponse.json({ message: 'Task added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding task:', error);
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, description, task_date, time, status, recurrence } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['Pending', 'Done', 'Postponed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate recurrence
    const validRecurrences = ['None', 'Daily', 'Weekly', 'Monthly'];
    if (recurrence && !validRecurrences.includes(recurrence)) {
      return NextResponse.json(
        { error: `Invalid recurrence. Must be one of: ${validRecurrences.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }
    if (task_date) {
      if (!moment(task_date, 'YYYY-MM-DD', true).isValid()) {
        client.release();
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
      }
      updates.push(`task_date = $${paramIndex++}`);
      values.push(task_date);
    }
    if (time !== undefined) {
      updates.push(`time = $${paramIndex++}`);
      values.push(time || null);
    }
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (recurrence) {
      updates.push(`recurrence = $${paramIndex++}`);
      values.push(recurrence);
    }

    if (updates.length === 0) {
      client.release();
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    console.log('Executing query:', query);
    console.log('With values:', values);

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    client.release();

    return NextResponse.json({ message: 'Task updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating task:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    client.release();

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}