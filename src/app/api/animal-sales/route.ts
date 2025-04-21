import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { type, quantity, sale_price, notes, cost_per_unit, isLoss } = await request.json();

  if (!type || !quantity || quantity <= 0) {
    return NextResponse.json(
      { error: 'Invalid input: type and quantity (positive) are required' },
      { status: 400 }
    );
  }

  if (!isLoss && (sale_price == null || sale_price < 0 || cost_per_unit == null)) {
    return NextResponse.json(
      { error: 'Invalid input: sale_price (non-negative) and cost_per_unit are required for sales' },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch the animal type to validate quantity
    const typeRes = await client.query('SELECT * FROM animal_types WHERE type = $1', [type]);
    if (typeRes.rowCount === 0) {
      throw new Error('Animal type not found');
    }

    const animalType = typeRes.rows[0];
    const totalQuantity = Number(animalType.quantity);
    if (totalQuantity < quantity) {
      throw new Error(`Not enough animals of type ${type}. Available: ${totalQuantity}, Requested: ${quantity}`);
    }

    if (isLoss) {
      // For losses, just decrease the quantity
      await client.query(
        `UPDATE animal_types
         SET quantity = quantity - $1
         WHERE type = $2`,
        [quantity, type]
      );

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Loss recorded successfully' }, { status: 201 });
    } else {
      // For sales, insert the sale record
      const saleRes = await client.query(
        `INSERT INTO animal_sales (type, quantity, sale_price, sale_date, notes, cost_per_unit)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         RETURNING *`,
        [type, quantity, sale_price, notes || null, cost_per_unit]
      );

      const newSale = saleRes.rows[0];
      newSale.sale_price = Number(newSale.sale_price);
      newSale.cost_per_unit = Number(newSale.cost_per_unit);

      // Update the animal type: decrease quantity and increase total_sales
      await client.query(
        `UPDATE animal_types
         SET quantity = quantity - $1,
             total_sales = total_sales + $2
         WHERE type = $3`,
        [quantity, sale_price, type]
      );

      await client.query('COMMIT');
      return NextResponse.json({ sale: newSale, message: 'Sale recorded successfully' }, { status: 201 });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('POST /api/animal-sales error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to record sale or loss' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch all sales to calculate the total quantity sold per type
    const salesRes = await pool.query('SELECT type, quantity FROM animal_sales');
    const salesByType: { [key: string]: number } = {};

    // Aggregate the total quantity sold for each type
    salesRes.rows.forEach((sale: { type: string; quantity: number }) => {
      salesByType[sale.type] = (salesByType[sale.type] || 0) + Number(sale.quantity);
    });

    // Delete all sales
    await client.query('DELETE FROM animal_sales');

    // Update the quantities in animal_types
    for (const [type, quantity] of Object.entries(salesByType)) {
      await client.query(
        `UPDATE animal_types
         SET quantity = quantity + $1,
             total_sales = 0
         WHERE type = $2`,
        [quantity, type]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'All sales reset successfully' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('DELETE /api/animal-sales error:', error);
    return NextResponse.json({ error: 'Failed to reset sales' }, { status: 500 });
  } finally {
    client.release();
  }
}