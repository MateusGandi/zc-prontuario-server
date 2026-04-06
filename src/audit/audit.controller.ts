import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { TokenPayload } from '../auth/auth.guard';
import { IsAdmin, CurrentUser } from '../auth/auth.guard';
import { TenantDataSourceService } from '../database/tenant-data-source.service';

@ApiTags('audit-logs')
@IsAdmin()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly tenantDs: TenantDataSourceService) {}

  @ApiOperation({ summary: 'Lista logs de auditoria paginados (admin)' })
  @ApiQuery({ name: 'table', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date — início do período',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO date — fim do período',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get()
  async findAll(
    @CurrentUser() user: TokenPayload,
    @Query('table') table?: string,
    @Query('recordId') recordId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (table) {
      params.push(table);
      conditions.push(`table_name = $${params.length}`);
    }
    if (recordId) {
      params.push(recordId);
      conditions.push(`record_id = $${params.length}`);
    }
    if (action) {
      params.push(action.toUpperCase());
      conditions.push(`action = $${params.length}`);
    }
    if (from) {
      params.push(new Date(from));
      conditions.push(`created_at >= $${params.length}`);
    }
    if (to) {
      params.push(new Date(to));
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(take);
    const limitIdx = params.length;
    params.push(skip);
    const offsetIdx = params.length;

    const ds = await this.tenantDs.getDataSource(user.tenantSchema);

    const s = user.tenantSchema;

    const [rows, countRows] = await Promise.all([
      ds.query<Record<string, unknown>[]>(
        `SELECT id, table_name AS "tableName", record_id AS "recordId",
                action, old_data AS "oldData", new_data AS "newData",
                user_id AS "userId", created_at AS "createdAt"
         FROM "${s}".audit_logs
         ${where}
         ORDER BY created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      ds.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM "${s}".audit_logs ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return {
      data: rows,
      total: Number(countRows[0]?.count ?? 0),
      page: parseInt(page, 10),
      limit: take,
    };
  }
}
