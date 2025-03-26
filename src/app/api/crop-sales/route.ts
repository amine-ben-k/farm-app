import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const { crop_id, quantity, sale_price, notes } = await request.json();

    if (!crop_id || quantity <= 0 || sale_price < 0) {
      return NextResponse.json({ error: 'Invalid crop ID, quantity, or sale price' }, { status: 400 });
    }

    const client = await pool.connect();

    // Verify the crop exists and has enough quantity
    const cropResult = await client.query('SELECT * FROM crops WHERE id = $1', [crop_id]);
    if (cropResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    const crop = cropResult.rows[0];
    if (crop.quantity < quantity) {
      client.release();
      return NextResponse.json({ error: 'Not enough quantity available for sale' }, { status: 400 });
    }

    // Calculate cost per unit at the time of sale
    const costPerUnit = crop.quantity > 0 ? crop.total_cost_of_care / crop.quantity : 0;

    // Record the sale
    await client.query(
      'INSERT INTO crop_sales (crop_id, quantity, sale_price, notes, cost_per_unit_at_sale) VALUES ($1, $2, $3, $4, $5)',
      [crop_id, quantity, sale_price, notes || null, costPerUnit]
    );

    // Update the crop quantity
    await client.query('UPDATE crops SET quantity = quantity - $1 WHERE id = $2', [
      quantity,
      crop_id,
    ]);

    client.release();

    return NextResponse.json({ message: 'Sale recorded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error recording crop sale:', error);
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const client = await pool.connect();

    // Delete all sales
    await client.query('DELETE FROM crop_sales');

    client.release();

    return NextResponse.json({ message: 'All sales reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error resetting crop sales:', error);
    return NextResponse.json({ error: 'Failed to reset sales' }, { status: 500 });
  }
}