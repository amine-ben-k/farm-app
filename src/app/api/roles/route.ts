import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM roles ORDER BY name');
    const roles = result.rows;
    client.release();
    return NextResponse.json({ roles }, { status: 200 });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    const newRole = result.rows[0];
    client.release();

    return NextResponse.json({ role: newRole }, { status: 201 });
  } catch (error) {
    console.error('Error adding role:', error);
    return NextResponse.json({ error: 'Failed to add role' }, { status: 500 });
  }
}