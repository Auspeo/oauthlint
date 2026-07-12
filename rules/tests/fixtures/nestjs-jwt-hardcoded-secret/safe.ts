import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // ok: auth.nestjs.jwt-hardcoded-secret -- secret read from the environment
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    // ok: auth.nestjs.jwt-hardcoded-secret -- secret resolved via ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
})
export class AuthModule {}

// ok: auth.nestjs.jwt-hardcoded-secret -- an unrelated object that happens to
// have a `secret` key, not a JwtModule config
const featureFlags = { secret: 'not-a-signing-key-just-a-flag-name' };
