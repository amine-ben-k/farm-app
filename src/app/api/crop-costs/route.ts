import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const { crop_id, cost_type, amount, notes } = await request.json();

    if (!crop_id || !cost_type || amount < 0) {
      return NextResponse.json({ error: 'Invalid crop ID, cost type, or amount' }, { status: 400 });
    }

    const client = await pool.connect();

    // Verify the crop exists
    const cropResult = await client.query('SELECT * FROM crops WHERE id = $1', [crop_id]);
    if (cropResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    // Insert the cost entry
    await client.query(
      'INSERT INTO crop_costs (crop_id, cost_type, amount, notes) VALUES ($1, $2, $3, $4)',
      [crop_id, cost_type, amount, notes || null]
    );

    // Update the total_cost_of_care in the crops table
    const totalCostsResult = await client.query(
      'SELECT SUM(amount) as total FROM crop_costs WHERE crop_id = $1',
      [crop_id]
    );
    const newTotalCost = totalCostsResult.rows[0].total || 0;

    await client.query('UPDATE crops SET total_cost_of_care = $1 WHERE id = $2', [
      newTotalCost,
      crop_id,
    ]);

    client.release();

    return NextResponse.json({ message: 'Cost recorded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error recording crop cost:', error);
    return NextResponse.json({ error: 'Failed to record cost' }, { status: 500 });
  }
}