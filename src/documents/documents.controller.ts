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
  Request,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShareDocumentDto } from './share-document.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    const userId = req.user.userId as number;
    return this.documentsService.findAllByParams({
      where: { owner_id: userId },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.documentDetails(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
    const userId = req.user.userId as number;
    return this.documentsService.create(createDocumentDto, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Record<string, any>) {
    return this.documentsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  async shareDocument(
    @Param('id') documentId: string,
    @Body() shareDto: ShareDocumentDto,
    @Request() req,
  ) {
    const userId = req.user.userId as number;
    if (!userId) {
      throw new Error('User not found');
    }
    return await this.documentsService.shareDocument(
      documentId,
      shareDto.email,
      shareDto.permission,
      userId,
    );
  }
}
