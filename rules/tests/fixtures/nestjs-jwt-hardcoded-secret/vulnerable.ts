import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    // ruleid: auth.nestjs.jwt-hardcoded-secret
    JwtModule.register({
      secret: 'super-secret-signing-key',
      signOptions: { expiresIn: '60s' },
    }),
  ],
})
export class AuthModule {}

@Module({
  imports: [
    JwtModule.registerAsync({
      // ruleid: auth.nestjs.jwt-hardcoded-secret
      useFactory: () => ({ secretOrPrivateKey: 'another-hardcoded-key' }),
    }),
  ],
})
export class OtherModule {}

// ruleid: auth.nestjs.jwt-hardcoded-secret
const service = new JwtService({ secret: 'inline-service-secret' });
