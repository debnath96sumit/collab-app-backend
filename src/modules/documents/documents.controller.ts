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
import { ShareDocumentDto } from './dto/share-document.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Version('1')
  @Get('get-my-docs')
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async getMyDocs(@LoginUser() user: AuthenticatedUser) {
    return await this.documentsService.getMyDocs(user);
  }

  @Version('1')
  @Get(':id')
  @ApiConsumes('application/json')
  async documentDetails(@Param('id') id: string) {
    return await this.documentsService.documentDetails(id);
  }

  @Version('1')
  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.documentsService.create(createDocumentDto, user.id);
  }

  @Version('1')
  @Put(':id')
  @ApiConsumes('application/json')
  async update(
    @Param('id') id: string,
    @Body() updateData: Record<string, any>,
  ) {
    return await this.documentsService.update(id, updateData);
  }

  @Version('1')
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async remove(@Param('id') id: string) {
    return await this.documentsService.remove(id);
  }

  @Version('1')
  @UseGuards(AuthGuard('jwt'))
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
      shareDto,
      userId,
    );
  }
}
