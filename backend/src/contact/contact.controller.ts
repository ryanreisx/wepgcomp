import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() dto: CreateContactDto) {
    return this.service.send(dto);
  }
}
