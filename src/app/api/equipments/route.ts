import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

interface Equipment {
  id: number;
  type: string;
  acquisition_type: string;
  acquisition_date: string;
  maintenance_cost: number;
  notes: string | null;
  total_transaction_cost: number;
}

interface EquipmentTransaction {
  id: number;
  equipment_id: number;
  transaction_type: string;
  amount: number;
  transaction_date: string;
  notes: string | null;
}

export async function GET() {
  try {
    const client = await pool.connect();

    // Fetch equipment with total transaction costs
    const equipmentsResult = await client.query(`
      SELECT e.*,
             COALESCE(SUM(et.amount), 0) AS total_transaction_cost
      FROM equipments e
      LEFT JOIN equipment_transactions et ON e.id = et.equipment_id
      GROUP BY e.id
      ORDER BY e.id
    `);
    const equipments: Equipment[] = equipmentsResult.rows.map((row: any) => ({
      ...row,
      maintenance_cost: parseFloat(row.maintenance_cost),
      total_transaction_cost: parseFloat(row.total_transaction_cost),
    }));

    // Fetch all transactions
    const transactionsResult = await client.query(`
      SELECT * FROM equipment_transactions
      ORDER BY transaction_date DESC
    `);
    const transactions: EquipmentTransaction[] = transactionsResult.rows.map((row: any) => ({
      ...row,
      amount: parseFloat(row.amount),
    }));

    client.release();

    return NextResponse.json({ equipments, transactions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const client = await pool.connect();

    if (action === 'add_equipment') {
      const { type, acquisition_type, acquisition_date, transaction_amount, notes } = data;

      if (!type || !acquisition_type) {
        client.release();
        return NextResponse.json({ error: 'Type and acquisition type are required' }, { status: 400 });
      }

      const validAcquisitionTypes = ['Purchased', 'Rented'];
      if (!validAcquisitionTypes.includes(acquisition_type)) {
        client.release();
        return NextResponse.json(
          { error: `Invalid acquisition type. Must be one of: ${validAcquisitionTypes.join(', ')}` },
          { status: 400 }
        );
      }

      // Default acquisition_date to today if not provided
      const finalAcquisitionDate = acquisition_date || new Date().toISOString().split('T')[0];

      // Start a transaction
      await client.query('BEGIN');

      // Insert the equipment
      const equipmentResult = await client.query(
        'INSERT INTO equipments (type, acquisition_type, acquisition_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [type, acquisition_type, finalAcquisitionDate, notes || null]
      );
      const newEquipment = equipmentResult.rows[0];

      // Insert the initial transaction only if transaction_amount is provided and non-negative
      if (transaction_amount !== undefined && transaction_amount >= 0) {
        await client.query(
          'INSERT INTO equipment_transactions (equipment_id, transaction_type, amount, transaction_date, notes) VALUES ($1, $2, $3, $4, $5)',
          [newEquipment.id, acquisition_type, transaction_amount, finalAcquisitionDate, notes || null]
        );
      }

      // Commit the transaction
      await client.query('COMMIT');

      client.release();

      return NextResponse.json({ equipment: newEquipment }, { status: 201 });
    } else if (action === 'add_rental_cost') {
      const { equipment_id, amount, transaction_date, notes } = data;

      if (!equipment_id || !amount) {
        client.release();
        return NextResponse.json({ error: 'Equipment ID and amount are required' }, { status: 400 });
      }

      // Default transaction_date to today if not provided
      const finalTransactionDate = transaction_date || new Date().toISOString().split('T')[0];

      // Verify the equipment exists and is rented
      const equipmentResult = await client.query('SELECT acquisition_type FROM equipments WHERE id = $1', [equipment_id]);
      if (equipmentResult.rowCount === 0) {
        client.release();
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }

      const equipment = equipmentResult.rows[0];
      if (equipment.acquisition_type !== 'Rented') {
        client.release();
        return NextResponse.json({ error: 'This equipment is not rented' }, { status: 400 });
      }

      // Insert the rental transaction
      await client.query(
        'INSERT INTO equipment_transactions (equipment_id, transaction_type, amount, transaction_date, notes) VALUES ($1, $2, $3, $4, $5)',
        [equipment_id, 'Rental', amount, finalTransactionDate, notes || null]
      );

      client.release();

      return NextResponse.json({ message: 'Rental cost recorded successfully' }, { status: 201 });
    } else if (action === 'add_maintenance_cost') {
      const { equipment_id, amount } = data;

      if (!equipment_id || !amount) {
        client.release();
        return NextResponse.json({ error: 'Equipment ID and amount are required' }, { status: 400 });
      }

      // Verify the equipment exists and is purchased
      const equipmentResult = await client.query('SELECT acquisition_type, maintenance_cost FROM equipments WHERE id = $1', [equipment_id]);
      if (equipmentResult.rowCount === 0) {
        client.release();
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }

      const equipment = equipmentResult.rows[0];
      if (equipment.acquisition_type !== 'Purchased') {
        client.release();
        return NextResponse.json({ error: 'This equipment is not purchased' }, { status: 400 });
      }

      // Update the maintenance cost
      const newMaintenanceCost = parseFloat(equipment.maintenance_cost) + parseFloat(amount);
      await client.query(
        'UPDATE equipments SET maintenance_cost = $1 WHERE id = $2',
        [newMaintenanceCost, equipment_id]
      );

      client.release();

      return NextResponse.json({ message: 'Maintenance cost updated successfully' }, { status: 200 });
    } else {
      client.release();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/equipments:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const client = await pool.connect();

    if (action === 'edit_equipment') {
      const { id, type, acquisition_type, acquisition_date, notes } = data;

      if (!id || !type || !acquisition_type || !acquisition_date) {
        client.release();
        return NextResponse.json({ error: 'ID, type, acquisition type, and acquisition date are required' }, { status: 400 });
      }

      const validAcquisitionTypes = ['Purchased', 'Rented'];
      if (!validAcquisitionTypes.includes(acquisition_type)) {
        client.release();
        return NextResponse.json(
          { error: `Invalid acquisition type. Must be one of: ${validAcquisitionTypes.join(', ')}` },
          { status: 400 }
        );
      }

      const result = await client.query(
        'UPDATE equipments SET type = $1, acquisition_type = $2, acquisition_date = $3, notes = $4 WHERE id = $5 RETURNING *',
        [type, acquisition_type, acquisition_date, notes || null, id]
      );

      if (result.rowCount === 0) {
        client.release();
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }

      client.release();

      return NextResponse.json({ message: 'Equipment updated successfully' }, { status: 200 });
    } else if (action === 'edit_transaction') {
      const { id, amount, transaction_date, notes } = data;

      if (!id || !amount || !transaction_date) {
        client.release();
        return NextResponse.json({ error: 'Transaction ID, amount, and transaction date are required' }, { status: 400 });
      }

      if (amount < 0) {
        client.release();
        return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
      }

      const result = await client.query(
        'UPDATE equipment_transactions SET amount = $1, transaction_date = $2, notes = $3 WHERE id = $4 RETURNING *',
        [amount, transaction_date, notes || null, id]
      );

      if (result.rowCount === 0) {
        client.release();
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      client.release();

      return NextResponse.json({ message: 'Transaction updated successfully' }, { status: 200 });
    } else {
      client.release();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PUT /api/equipments:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    const result = await client.query('DELETE FROM equipments WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    client.release();

    return NextResponse.json({ message: 'Equipment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}