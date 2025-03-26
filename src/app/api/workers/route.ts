import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

interface Worker {
  id: number;
  name: string;
  role_id: number;
  role_name: string;
  payment_type: string;
  payment_rate: number; // Ensure this is a number
  responsibility_area: string | null;
  notes: string | null;
  total_payments: number; // Ensure this is a number
}

interface SalaryPayment {
  id: number;
  worker_id: number;
  worker_name: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  task_description: string | null;
  notes: string | null;
}

export async function GET() {
  try {
    const client = await pool.connect();

    const workersResult = await client.query(`
      SELECT w.*, r.name AS role_name, COALESCE(SUM(sp.amount), 0) AS total_payments
      FROM workers w
      LEFT JOIN roles r ON w.role_id = r.id
      LEFT JOIN salary_payments sp ON w.id = sp.worker_id
      GROUP BY w.id, r.name
      ORDER BY w.id
    `);
    const workers: Worker[] = workersResult.rows.map((row: any) => ({
      ...row,
      payment_rate: parseFloat(row.payment_rate), // Convert to number
      total_payments: parseFloat(row.total_payments), // Convert to number
    }));

    const paymentsResult = await client.query(`
      SELECT sp.*, w.name AS worker_name
      FROM salary_payments sp
      JOIN workers w ON sp.worker_id = w.id
      ORDER BY sp.payment_date DESC
    `);
    const payments: SalaryPayment[] = paymentsResult.rows.map((row: any) => ({
      ...row,
      amount: parseFloat(row.amount), // Convert to number
    }));

    client.release();

    return NextResponse.json({ workers, payments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, role_id, payment_type, payment_rate, responsibility_area, notes } = await request.json();

    if (!name || !role_id || !payment_type || payment_rate < 0) {
      return NextResponse.json({ error: 'Name, role, payment type, and non-negative payment rate are required' }, { status: 400 });
    }

    const validPaymentTypes = ['Monthly', 'Daily', 'Per Task'];
    if (!validPaymentTypes.includes(payment_type)) {
      return NextResponse.json(
        { error: `Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Verify the role_id exists
    const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const result = await client.query(
      'INSERT INTO workers (name, role_id, payment_type, payment_rate, responsibility_area, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, role_id, payment_type, payment_rate, responsibility_area || null, notes || null]
    );
    const newWorker = {
      ...result.rows[0],
      payment_rate: parseFloat(result.rows[0].payment_rate), // Convert to number
    };

    client.release();

    return NextResponse.json({ worker: newWorker }, { status: 201 });
  } catch (error) {
    console.error('Error adding worker:', error);
    return NextResponse.json({ error: 'Failed to add worker' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, role_id, payment_type, payment_rate, responsibility_area, notes } = await request.json();

    if (!id || !name || !role_id || !payment_type || payment_rate < 0) {
      return NextResponse.json({ error: 'ID, name, role, payment type, and non-negative payment rate are required' }, { status: 400 });
    }

    const validPaymentTypes = ['Monthly', 'Daily', 'Per Task'];
    if (!validPaymentTypes.includes(payment_type)) {
      return NextResponse.json(
        { error: `Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Verify the role_id exists
    const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1', [role_id]);
    if (roleCheck.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const result = await client.query(
      'UPDATE workers SET name = $1, role_id = $2, payment_type = $3, payment_rate = $4, responsibility_area = $5, notes = $6 WHERE id = $7 RETURNING *',
      [name, role_id, payment_type, payment_rate, responsibility_area || null, notes || null, id]
    );

    if (result.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    client.release();

    return NextResponse.json({ message: 'Worker updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating worker:', error);
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    const result = await client.query('DELETE FROM workers WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    client.release();

    return NextResponse.json({ message: 'Worker deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}