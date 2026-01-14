import { Pool } from '@neondatabase/serverless';

// Lazy-initialized pool to avoid build-time errors
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

// Export for backwards compatibility
export { pool };
