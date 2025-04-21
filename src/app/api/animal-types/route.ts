import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type) {
      // Fetch a specific animal type
      const typeRes = await pool.query('SELECT * FROM animal_types WHERE type = $1', [type]);
      if (typeRes.rowCount === null) {
        throw new Error('Failed to fetch animal type: query returned null rowCount');
      }
      if (typeRes.rowCount === 0) {
        return NextResponse.json({ error: 'Animal type not found' }, { status: 404 });
      }

      const animalType = typeRes.rows[0];
      animalType.quantity = Number(animalType.quantity);
      animalType.initial_quantity = Number(animalType.initial_quantity);
      animalType.total_cost_of_living = Number(animalType.total_cost_of_living);
      animalType.total_sales = Number(animalType.total_sales);

      // Fetch cost of living history for this type
      const costHistoryRes = await pool.query(
        'SELECT * FROM cost_of_living_history WHERE type = $1 ORDER BY recorded_at DESC',
        [type]
      );
      const costHistory = costHistoryRes.rows.map((entry) => ({
        ...entry,
        cost: Number(entry.cost),
      }));

      return NextResponse.json({ ...animalType, costHistory });
    } else {
      // Fetch all animal types and sales
      const typesRes = await pool.query('SELECT * FROM animal_types ORDER BY type');
      const types = typesRes.rows.map((type) => ({
        ...type,
        quantity: Number(type.quantity),
        initial_quantity: Number(type.initial_quantity),
        total_cost_of_living: Number(type.total_cost_of_living),
        total_sales: Number(type.total_sales),
      }));

      const salesRes = await pool.query('SELECT * FROM animal_sales ORDER BY sale_date DESC');
      const sales = salesRes.rows.map((sale) => ({
        ...sale,
        quantity: Number(sale.quantity),
        sale_price: Number(sale.sale_price),
        cost_per_unit: Number(sale.cost_per_unit),
      }));

      // Fetch all cost of living history
      const costHistoryRes = await pool.query('SELECT * FROM cost_of_living_history ORDER BY recorded_at DESC');
      const costHistory = costHistoryRes.rows.map((entry) => ({
        ...entry,
        cost: Number(entry.cost),
      }));

      return NextResponse.json({ types, sales, costHistory });
    }
  } catch (error) {
    console.error('GET /api/animal-types error:', error);
    return NextResponse.json({ error: 'Failed to fetch animal types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { type, quantity, initial_quantity, total_cost_of_living } = await request.json();

  if (!type || quantity == null || quantity < 0 || initial_quantity == null || initial_quantity < 0) {
    return NextResponse.json(
      { error: 'Invalid input: type, quantity (non-negative), and initial_quantity (non-negative) are required' },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the type already exists
    const existingTypeRes = await client.query('SELECT * FROM animal_types WHERE type = $1', [type]);
    if (existingTypeRes.rowCount === null) {
      throw new Error('Failed to check existing animal type: query returned null rowCount');
    }
    if (existingTypeRes.rowCount > 0) {
      throw new Error('Animal type already exists. Use the "Add More Animals" action to increase quantity.');
    }

    const res = await client.query(
      `INSERT INTO animal_types (type, quantity, initial_quantity, total_cost_of_living, total_sales)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING *`,
      [type, quantity, initial_quantity, total_cost_of_living || 0]
    );

    const newType = res.rows[0];
    newType.quantity = Number(newType.quantity);
    newType.initial_quantity = Number(newType.initial_quantity);
    newType.total_cost_of_living = Number(newType.total_cost_of_living);
    newType.total_sales = Number(newType.total_sales);

    await client.query('COMMIT');
    return NextResponse.json(newType, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('POST /api/animal-types error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to add animal type' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const { type, quantity, initial_quantity, total_cost_of_living, cost_of_living_entry } = await request.json();

  if (!type) {
    return NextResponse.json({ error: 'Invalid input: type is required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // If adding a cost of living entry, insert into cost_of_living_history
    if (cost_of_living_entry) {
      const { cost, month } = cost_of_living_entry;
      if (!cost || cost < 0 || !month) {
        throw new Error('Invalid cost of living entry: cost (non-negative) and month are required');
      }

      await client.query(
        `INSERT INTO cost_of_living_history (type, cost, month, recorded_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [type, cost, month]
      );
    }

    // Update the animal type
    const res = await client.query(
      `UPDATE animal_types
       SET
         quantity = COALESCE($2, quantity),
         initial_quantity = COALESCE($3, initial_quantity),
         total_cost_of_living = COALESCE($4, total_cost_of_living)
       WHERE type = $1
       RETURNING *`,
      [type, quantity, initial_quantity, total_cost_of_living]
    );

    if (res.rowCount === null) {
      throw new Error('Failed to update animal type: query returned null rowCount');
    }
    if (res.rowCount === 0) {
      throw new Error('Animal type not found');
    }

    const updatedType = res.rows[0];
    updatedType.quantity = Number(updatedType.quantity);
    updatedType.initial_quantity = Number(updatedType.initial_quantity);
    updatedType.total_cost_of_living = Number(updatedType.total_cost_of_living);
    updatedType.total_sales = Number(updatedType.total_sales);

    await client.query('COMMIT');
    return NextResponse.json(updatedType);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('PUT /api/animal-types error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update animal type' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type) {
    return NextResponse.json({ error: 'Invalid input: type is required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the animal type exists
    const typeRes = await client.query('SELECT * FROM animal_types WHERE type = $1', [type]);
    if (typeRes.rowCount === null) {
      throw new Error('Failed to check animal type: query returned null rowCount');
    }
    if (typeRes.rowCount === 0) {
      throw new Error('Animal type not found');
    }

    // Delete associated sales and cost of living history
    await client.query('DELETE FROM animal_sales WHERE type = $1', [type]);
    await client.query('DELETE FROM cost_of_living_history WHERE type = $1', [type]);

    // Delete the animal type
    await client.query('DELETE FROM animal_types WHERE type = $1', [type]);

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Animal type deleted successfully' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('DELETE /api/animal-types error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete animal type' }, { status: 500 });
  } finally {
    client.release();
  }
}