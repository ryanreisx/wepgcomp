import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserLevel } from '@prisma/client';
import * as path from 'path';
import { CertificateService } from './certificate.service';
import { Levels } from '../common/decorators/levels.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('certificates')
export class CertificateController {
  private readonly uploadDir: string;

  constructor(
    private readonly service: CertificateService,
    configService: ConfigService,
  ) {
    this.uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
  }

  @Post('generate')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async generate(@Query('eventEditionId') eventEditionId: string) {
    const data = await this.service.generateAll(eventEditionId);
    return { data, message: 'Certificates generated successfully' };
  }

  @Get('my')
  async findMy(@CurrentUser() user: { sub: string }) {
    const data = await this.service.findMy(user.sub);
    return { data };
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; level: string },
    @Res() res: Response,
  ) {
    const certificate = await this.service.download(id, user.sub, user.level);
    const filePath = path.resolve(this.uploadDir, certificate.filePath);

    res.download(filePath, 'certificate.pdf');
  }
}
