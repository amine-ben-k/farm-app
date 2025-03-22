// farm-management-system/src/app/api/workers/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query('SELECT * FROM workers');
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, role, hours_worked, wage } = await request.json();
  try {
    const res = await pool.query(
      'INSERT INTO workers (name, role, hours_worked, wage) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, role, hours_worked, wage]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add worker' }, { status: 500 });
  }
}