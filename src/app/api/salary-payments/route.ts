// src/app/api/salary-payments/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { worker_id, amount, payment_date, payment_type, task_description, notes } = await request.json();

  if (!worker_id || amount == null || amount < 0 || !payment_type) {
    return NextResponse.json({ error: 'Invalid input: worker_id, amount (non-negative), and payment_type are required' }, { status: 400 });
  }

  if (!['Monthly', 'Daily', 'Per Task'].includes(payment_type)) {
    return NextResponse.json({ error: 'Invalid payment_type: must be Monthly, Daily, or Per Task' }, { status: 400 });
  }

  if (payment_type === 'Per Task' && !task_description) {
    return NextResponse.json({ error: 'Task description is required for Per Task payments' }, { status: 400 });
  }

  try {
    const workerRes = await pool.query('SELECT * FROM workers WHERE id = $1 AND is_active = TRUE', [worker_id]);
    if (workerRes.rowCount === 0) {
      return NextResponse.json({ error: 'Worker not found or not active' }, { status: 404 });
    }

    const worker = workerRes.rows[0];
    if (worker.payment_type !== payment_type) {
      return NextResponse.json({ error: `Payment type mismatch: worker is paid ${worker.payment_type}, but payment is recorded as ${payment_type}` }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO salary_payments (worker_id, amount, payment_date, payment_type, task_description, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [worker_id, amount, payment_date || new Date().toISOString(), payment_type, task_description || null, notes || null]
    );

    const newPayment = res.rows[0];
    newPayment.amount = Number(newPayment.amount);

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to record payment' }, { status: 500 });
  }
}