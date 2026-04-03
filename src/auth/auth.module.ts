import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { User } from '../user/user.entity';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [JwtModule, AuthGuard],
})
export class AuthModule {}
