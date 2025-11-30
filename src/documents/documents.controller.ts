import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Version,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShareDocumentDto } from './share-document.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { LoginUser } from '../common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Version("1")
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiConsumes('application/json')
  findAll(@LoginUser() user: AuthenticatedUser) {
    return this.documentsService.findAllByParams({
      where: { owner_id: user.id },
    });
  }

  @Version("1")
  @Get(':id')
  @ApiConsumes('application/json')
  findOne(@Param('id') id: string) {
    return this.documentsService.documentDetails(id);
  }

  @Version("1")
  @UseGuards(JwtAuthGuard)
  @Post('create')
  @ApiConsumes('application/json')
  async create(@Body() createDocumentDto: CreateDocumentDto, @LoginUser() user: AuthenticatedUser) {
    return this.documentsService.create(createDocumentDto, user.id);
  }

  @Version("1")
  @Put(':id')
  @ApiConsumes('application/json')
  update(@Param('id') id: string, @Body() updateData: Record<string, any>) {
    return this.documentsService.update(id, updateData);
  }

  @Version("1")
  @Delete(':id')
  @ApiConsumes('application/json')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Version("1")
  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  @ApiConsumes('application/json')
  async shareDocument(
    @Param('id') documentId: string,
    @Body() shareDto: ShareDocumentDto,
    @LoginUser() user: AuthenticatedUser,
  ) {
    const userId = user.id;
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
