import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { AuditLog } from './audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  async afterInsert(event: InsertEvent<any>) {
    if (event.metadata.targetName === 'AuditLog') return;

    // Tentar pegar o usuário da requisição via algum contexto injetado, 
    // ou se o objeto já tiver createdBy.
    const record = event.entity;
    const log = new AuditLog();
    log.tableName = event.metadata.tableName;
    log.recordId = record?.id;
    log.action = 'INSERT';
    log.newData = record;
    log.userId = record?.createdBy || null;

    try {
      if (log.tableName && log.recordId) {
        await event.manager.save(AuditLog, log);
      }
    } catch (e) {
      console.error('Falha ao auditar insert', e);
    }
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (event.metadata.targetName === 'AuditLog') return;

    const record = event.entity;
    const log = new AuditLog();
    log.tableName = event.metadata.tableName;
    log.recordId = record?.id || event.databaseEntity?.id;
    log.action = 'UPDATE';
    log.oldData = event.databaseEntity;
    log.newData = record;
    log.userId = record?.updatedBy || null;

    try {
       if (log.tableName && log.recordId) {
         await event.manager.save(AuditLog, log);
       }
    } catch (e) {
      console.error('Falha ao auditar update', e);
    }
  }

  async afterRemove(event: RemoveEvent<any>) {
    if (event.metadata.targetName === 'AuditLog') return;

    const log = new AuditLog();
    log.tableName = event.metadata.tableName;
    log.recordId = event.entityId;
    log.action = 'DELETE';
    log.oldData = event.databaseEntity;

    try {
       if (log.tableName && log.recordId) {
         await event.manager.save(AuditLog, log);
       }
    } catch (e) {
      console.error('Falha ao auditar delete', e);
    }
  }
}
