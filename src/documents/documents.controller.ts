import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    const userId = req.user.userId as number;
    return this.documentsService.findAllByParams({
      where: { owner_id: userId }
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body('title') title: string, @Req() req) {
    const userId = req.user.userId as number;
    return this.documentsService.create({
      title,
      owner_id: userId,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Record<string, any>) {
    return this.documentsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
