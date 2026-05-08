import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [UserModule, MessagingModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
