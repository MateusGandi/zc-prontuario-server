import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
    AppointmentModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
