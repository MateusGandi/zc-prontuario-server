import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AuditModule } from './audit/audit.module';
import { PatientModule } from './patient/patient.module';
import { DatabaseModule } from './database/database.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { WebhookModule } from './webhook/webhook.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 20 },
      { name: 'long', ttl: 3600000, limit: 200 },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'admin'),
        password: config.get<string>('DB_PASS', 'admin_password'),
        database: config.get<string>('DB_NAME', 'zc_prontuario'),
        autoLoadEntities: true,
        synchronize: false, // gerenciado por migrations
      }),
    }),

    AuthModule,
    TenantModule,
    DatabaseModule,
    CircuitBreakerModule,
    AppointmentModule,
    AuditModule,
    PatientModule,
    WebhookModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
