// src/app/api/animals/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Animal ID is required' }, { status: 400 });
  }

  try {
    const res = await pool.query('DELETE FROM animals WHERE id = $1 RETURNING *', [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Animal deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete animal' }, { status: 500 });
  }
}