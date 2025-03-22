// farm-management-system/src/app/api/crops/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query('SELECT * FROM crops');
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch crops' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { type, quantity, growth_stage, cost, revenue } = await request.json();
  try {
    const res = await pool.query(
      'INSERT INTO crops (type, quantity, growth_stage, cost, revenue) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [type, quantity, growth_stage, cost, revenue]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add crop' }, { status: 500 });
  }
}