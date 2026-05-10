import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserLevel } from '@prisma/client';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('pdfFile'))
  async create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: { sub: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /(pdf|jpeg|jpg)$/i }),
        ],
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file: Express.Multer.File,
  ) {
    const data = await this.submissionService.create(dto, user.sub, file);
    return { data, message: 'Submission created successfully' };
  }

  @Get()
  @Public()
  async findAll(@Query('eventEditionId') eventEditionId?: string) {
    const data = await this.submissionService.findAll(eventEditionId);
    return { data };
  }

  @Get('my')
  async findMy(@CurrentUser() user: { sub: string }) {
    const data = await this.submissionService.findByAuthor(user.sub);
    return { data };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const data = await this.submissionService.findById(id);
    return { data };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('pdfFile'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser() user: { sub: string; level: UserLevel },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /(pdf|jpeg|jpg)$/i }),
        ],
        fileIsRequired: false,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const data = await this.submissionService.update(
      id,
      dto,
      user.sub,
      user.level,
      file,
    );
    return { data, message: 'Submission updated successfully' };
  }

  @Delete(':id')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.submissionService.delete(id);
  }
}
