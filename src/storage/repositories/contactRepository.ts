/**
 * ZenChat Storage — Contact Repository
 *
 * Parameterized SQL queries for local contact persistence.
 */

import { databaseManager } from '../database';
import type { Contact } from '../../state/stores/useContactStore';

export class ContactRepository {
  async getAll(): Promise<Contact[]> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute('SELECT * FROM contacts ORDER BY added_at DESC');
    return result.rows.map(row => ({
      userId: row.user_id,
      displayName: row.display_name,
      publicKey: row.public_key,
      localNickname: row.local_nickname,
      addedAt: Number(row.added_at),
      lastSeenAt: row.last_seen_at ? Number(row.last_seen_at) : undefined,
      lastKnownBleId: row.last_known_ble_id,
      trusted: Boolean(row.trusted),
      blocked: Boolean(row.blocked),
      verified: Boolean(row.verified),
    }));
  }

  async getById(userId: string): Promise<Contact | null> {
    const db = await databaseManager.getAdapter();
    const result = await db.execute('SELECT * FROM contacts WHERE user_id = ? LIMIT 1', [userId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      userId: row.user_id,
      displayName: row.display_name,
      publicKey: row.public_key,
      localNickname: row.local_nickname,
      addedAt: Number(row.added_at),
      lastSeenAt: row.last_seen_at ? Number(row.last_seen_at) : undefined,
      lastKnownBleId: row.last_known_ble_id,
      trusted: Boolean(row.trusted),
      blocked: Boolean(row.blocked),
      verified: Boolean(row.verified),
    };
  }

  async upsert(contact: Contact): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute(
      `INSERT INTO contacts (user_id, display_name, public_key, local_nickname, added_at, last_seen_at, last_known_ble_id, trusted, blocked, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         display_name = excluded.display_name,
         public_key = coalesce(excluded.public_key, contacts.public_key),
         local_nickname = coalesce(excluded.local_nickname, contacts.local_nickname),
         last_seen_at = coalesce(excluded.last_seen_at, contacts.last_seen_at),
         last_known_ble_id = coalesce(excluded.last_known_ble_id, contacts.last_known_ble_id),
         trusted = excluded.trusted,
         blocked = excluded.blocked,
         verified = excluded.verified;`,
      [
        contact.userId,
        contact.displayName,
        contact.publicKey ?? null,
        contact.localNickname ?? null,
        contact.addedAt,
        contact.lastSeenAt ?? null,
        contact.lastKnownBleId ?? null,
        contact.trusted ? 1 : 0,
        contact.blocked ? 1 : 0,
        contact.verified ? 1 : 0,
      ],
    );
  }

  async delete(userId: string): Promise<void> {
    const db = await databaseManager.getAdapter();
    await db.execute('DELETE FROM contacts WHERE user_id = ?', [userId]);
  }
}

export const contactRepository = new ContactRepository();
