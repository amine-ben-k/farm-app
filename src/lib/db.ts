// src/lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'farm_management',
  password: 's7an123', 
  port: 5432,
});

export default pool;