import { getDatabase } from "../database/database";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export class UserRepository {
  async create(email: string, passwordHash: string): Promise<number> {
    const db = await getDatabase();

    const result = await db.runAsync(
      `INSERT INTO users (email, passwordHash)
       VALUES (?, ?)`,
      [email, passwordHash],
    );

    return result.lastInsertRowId;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();

    const user = await db.getFirstAsync<User>(
      `SELECT id, email, passwordHash, createdAt
       FROM users
       WHERE email = ?`,
      [email],
    );

    return user ?? null;
  }
}
