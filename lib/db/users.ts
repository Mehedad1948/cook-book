import { getPool } from "./pool";

export type User = { id: string; phone: string; name: string | null; role: "user" | "admin"; createdAt: Date };
type Row = { id: string; phone: string; name: string | null; role: "user" | "admin"; created_at: Date };
const map = (r: Row): User => ({ id: r.id, phone: r.phone, name: r.name, role: r.role, createdAt: r.created_at });

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await getPool().query<Row>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? map(rows[0]) : null;
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const { rows } = await getPool().query<Row>("SELECT * FROM users WHERE phone = $1", [phone]);
  return rows[0] ? map(rows[0]) : null;
}

/** Idempotent on the unique phone column. */
export async function upsertUserByPhone(phone: string): Promise<User> {
  const { rows } = await getPool().query<Row>(
    `INSERT INTO users (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING *`,
    [phone],
  );
  return map(rows[0]);
}

export async function deleteUserByPhone(phone: string): Promise<void> {
  await getPool().query("DELETE FROM users WHERE phone = $1", [phone]);
}
