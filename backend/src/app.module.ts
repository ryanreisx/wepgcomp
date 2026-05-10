import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MessagingModule } from './messaging/messaging.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EventEditionModule } from './event-edition/event-edition.module';
import { RoomModule } from './room/room.module';
import { GuidanceModule } from './guidance/guidance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MessagingModule,
    UserModule,
    AuthModule,
    EventEditionModule,
    RoomModule,
    GuidanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
