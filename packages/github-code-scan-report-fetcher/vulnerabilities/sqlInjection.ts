import { Client } from 'pg';

async function getUserById(userId: string) {
  const client = new Client();
  await client.connect();
  // Vulnerable to SQL Injection
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  const res = await client.query(query);
  await client.end();
  return res.rows;
}
