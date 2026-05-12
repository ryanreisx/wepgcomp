import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [EventEditionModule, MessagingModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
