// src/app/api/animal-types/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const typesRes = await pool.query('SELECT * FROM animal_types ORDER BY type');
    const types = typesRes.rows.map((type) => ({
      ...type,
      total_purchase_cost: Number(type.total_purchase_cost),
      total_cost_of_living: Number(type.total_cost_of_living),
      total_sales: Number(type.total_sales),
    }));

    const salesRes = await pool.query('SELECT * FROM animal_sales ORDER BY sale_date DESC');
    const sales = salesRes.rows.map((sale) => ({
      ...sale,
      sale_price: Number(sale.sale_price),
      cost_per_unit: Number(sale.cost_per_unit),
    }));

    return NextResponse.json({ types, sales });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch animal types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { type, quantity, total_purchase_cost, total_cost_of_living } = await request.json();

  if (!type || quantity == null || quantity < 0) {
    return NextResponse.json({ error: 'Invalid input: type and quantity (non-negative) are required' }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `INSERT INTO animal_types (type, quantity, total_purchase_cost, total_cost_of_living)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (type)
       DO UPDATE SET
         quantity = animal_types.quantity + EXCLUDED.quantity,
         total_purchase_cost = animal_types.total_purchase_cost + COALESCE(EXCLUDED.total_purchase_cost, 0),
         total_cost_of_living = animal_types.total_cost_of_living + COALESCE(EXCLUDED.total_cost_of_living, 0)
       RETURNING *`,
      [type, quantity, total_purchase_cost || 0, total_cost_of_living || 0]
    );

    const newType = res.rows[0];
    newType.total_purchase_cost = Number(newType.total_purchase_cost);
    newType.total_cost_of_living = Number(newType.total_cost_of_living);
    newType.total_sales = Number(newType.total_sales);

    return NextResponse.json(newType, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to add or update animal type' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { type, total_purchase_cost, total_cost_of_living } = await request.json();

  if (!type) {
    return NextResponse.json({ error: 'Invalid input: type is required' }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `UPDATE animal_types
       SET
         total_purchase_cost = COALESCE($2, total_purchase_cost),
         total_cost_of_living = COALESCE($3, total_cost_of_living)
       WHERE type = $1
       RETURNING *`,
      [type, total_purchase_cost, total_cost_of_living]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Animal type not found' }, { status: 404 });
    }

    const updatedType = res.rows[0];
    updatedType.total_purchase_cost = Number(updatedType.total_purchase_cost);
    updatedType.total_cost_of_living = Number(updatedType.total_cost_of_living);
    updatedType.total_sales = Number(updatedType.total_sales);

    return NextResponse.json(updatedType);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update animal type' }, { status: 500 });
  }
}