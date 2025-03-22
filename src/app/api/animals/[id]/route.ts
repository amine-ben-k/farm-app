// src/app/api/animals/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { type, count, health_status, production, feed_cost } = await request.json();
    const { id } = params; // Extract ID from URL params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid Animal ID' }, { status: 400 });
    }

    const res = await pool.query(
      'UPDATE animals SET type = $1, count = $2, health_status = $3, production = $4, feed_cost = $5 WHERE id = $6 RETURNING *',
      [type, count, health_status, production, feed_cost, Number(id)]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    const updatedAnimal = res.rows[0];
    updatedAnimal.feed_cost = updatedAnimal.feed_cost != null ? Number(updatedAnimal.feed_cost) : null;
    return NextResponse.json(updatedAnimal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update animal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // Extract ID from URL params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid Animal ID' }, { status: 400 });
    }

    const res = await pool.query('DELETE FROM animals WHERE id = $1', [Number(id)]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete animal' }, { status: 500 });
  }
}