import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    // Fetch all crops
    const cropsResult = await client.query('SELECT * FROM crops');
    const crops = cropsResult.rows.map((crop: any) => ({
      ...crop,
      total_cost_of_care: parseFloat(crop.total_cost_of_care), // Convert to number
    }));

    // Fetch all crop sales
    const salesResult = await client.query(`
      SELECT cs.*, c.type
      FROM crop_sales cs
      JOIN crops c ON cs.crop_id = c.id
    `);
    const sales = salesResult.rows.map((sale: any) => ({
      ...sale,
      sale_price: parseFloat(sale.sale_price), // Convert to number
      cost_per_unit_at_sale: parseFloat(sale.cost_per_unit_at_sale), // Convert to number
    }));

    // Fetch all crop costs
    const costsResult = await client.query(`
      SELECT cc.*, c.type
      FROM crop_costs cc
      JOIN crops c ON cc.crop_id = c.id
    `);
    const costs = costsResult.rows.map((cost: any) => ({
      ...cost,
      amount: parseFloat(cost.amount), // Convert to number
    }));

    client.release();

    return NextResponse.json({ crops, sales, costs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching crops:', error);
    return NextResponse.json({ error: 'Failed to fetch crops' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, quantity, total_cost_of_care, growth_stage } = await request.json();

    if (!type || quantity < 0) {
      return NextResponse.json({ error: 'Invalid type or quantity' }, { status: 400 });
    }

    const client = await pool.connect();

    // Check if the crop type already exists
    const existingCrop = await client.query('SELECT * FROM crops WHERE type = $1', [type]);
    if (existingCrop.rows.length > 0) {
      client.release();
      return NextResponse.json({ error: 'Crop type already exists' }, { status: 400 });
    }

    // Insert the new crop
    await client.query(
      'INSERT INTO crops (type, quantity, total_cost_of_care, growth_stage) VALUES ($1, $2, $3, $4)',
      [type, quantity, total_cost_of_care || 0, growth_stage || null]
    );

    client.release();

    return NextResponse.json({ message: 'Crop added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding crop:', error);
    return NextResponse.json({ error: 'Failed to add crop' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { type, total_cost_of_care, growth_stage } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    const client = await pool.connect();

    // Update the crop's total_cost_of_care and growth_stage
    const result = await client.query(
      'UPDATE crops SET total_cost_of_care = $1, growth_stage = $2 WHERE type = $3 RETURNING *',
      [total_cost_of_care, growth_stage || null, type]
    );

    if (result.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    client.release();

    return NextResponse.json({ message: 'Crop updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating crop:', error);
    return NextResponse.json({ error: 'Failed to update crop' }, { status: 500 });
  }
}