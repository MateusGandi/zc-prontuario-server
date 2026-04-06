import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface AuditEntry {
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: object | null;
  newData?: object | null;
  userId?: string | null;
}

@Injectable()
export class AuditService {
  async log(ds: DataSource, entry: AuditEntry): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = (ds.options as any).schema as string;
    try {
      await ds.query(
        `INSERT INTO "${schema}".audit_logs
           (table_name, record_id, action, old_data, new_data, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.tableName,
          entry.recordId,
          entry.action,
          entry.oldData ? JSON.stringify(entry.oldData) : null,
          entry.newData ? JSON.stringify(entry.newData) : null,
          entry.userId ?? null,
        ],
      );
    } catch (e) {
      // Nunca deixar falha de auditoria quebrar a requisição principal
      console.error('[AuditService] Falha ao registrar log', e);
    }
  }
}
