// src/app/api/responsibility-areas/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query('SELECT * FROM responsibility_areas ORDER BY name');
    return NextResponse.json({ areas: res.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch responsibility areas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, description } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Invalid input: name is required' }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `INSERT INTO responsibility_areas (name, description)
       VALUES ($1, $2) RETURNING *`,
      [name, description || null]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to add responsibility area' }, { status: 500 });
  }
}