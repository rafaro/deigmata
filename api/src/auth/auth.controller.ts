import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-crententials-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post()
  signIn(
    @Body(ValidationPipe)
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string; }> {
    return this.authService.signIn(authCredentialsDto);
  }
}
