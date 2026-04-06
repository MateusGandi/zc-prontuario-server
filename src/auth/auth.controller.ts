import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsPublic } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Controller('auth')
@Throttle({
  short: { ttl: 60000, limit: 5 },
  long: { ttl: 3600000, limit: 20 },
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @IsPublic()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @IsPublic()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }
}
