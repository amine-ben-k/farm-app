// src/app/api/animals/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Fetch individual animals
    const animalsRes = await pool.query(`
      SELECT a1.*, a2.id AS parent_id, a2.type AS parent_type
      FROM animals a1
      LEFT JOIN animals a2 ON a1.parent_id = a2.id
      ORDER BY a1.created_at DESC
    `);
    const animals = animalsRes.rows.map((animal) => ({
      ...animal,
      purchase_price: Number(animal.purchase_price),
      feed_cost: Number(animal.feed_cost),
    }));

    // Fetch summary per type
    const summaryRes = await pool.query('SELECT * FROM animal_types');
    const summary = summaryRes.rows.map((type) => ({
      ...type,
      total_purchase_price: Number(type.total_purchase_price),
      total_feed_cost: Number(type.total_feed_cost),
    }));

    return NextResponse.json({ animals, summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch animals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { type, purchase_price, feed_cost, production, parent_id } = await request.json();

  if (!type || purchase_price == null || feed_cost == null) {
    return NextResponse.json({ error: 'Invalid input: type, purchase_price, and feed_cost are required' }, { status: 400 });
  }

  try {
    // Insert the new animal
    const res = await pool.query(
      `INSERT INTO animals (type, purchase_price, feed_cost, production, parent_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [type, purchase_price, feed_cost, production || null, parent_id || null]
    );

    const newAnimal = res.rows[0];
    newAnimal.purchase_price = Number(newAnimal.purchase_price);
    newAnimal.feed_cost = Number(newAnimal.feed_cost);

    // Note: The trigger will automatically update the animal_types table
    return NextResponse.json(newAnimal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add animal' }, { status: 500 });
  }
}