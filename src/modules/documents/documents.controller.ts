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
  Patch,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
import { AuthGuard } from '@nestjs/passport';
import { AddCollaboratorDto } from './dto/share-document.dto';
import {
  UpdateDocumentDto,
  UpdateLinkSettingsDto,
} from './dto/update-document.dto';
import { UpdateCollaboratorRoleDto } from './dto/collaborator.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Version('1')
  @Get('get-my-docs')
  @ApiBearerAuth()
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
  @Patch(':id')
  @ApiConsumes('application/json')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDocumentDto) {
    return await this.documentsService.update(id, updateDto);
  }

  @Version('1')
  @Patch(':id/settings')
  @ApiConsumes('application/json')
  async updateDocSettings(
    @Param('id') id: string,
    @Body() updateDto: UpdateLinkSettingsDto,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.documentsService.updateDocSettings(id, updateDto, user);
  }

  @Version('1')
  @Delete(':id/delete')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async remove(@Param('id') id: string) {
    return await this.documentsService.remove(id);
  }

  @Version('1')
  @Post(':id/add-collaborators')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async addCollaborator(
    @Param('id') id: string,
    @Body() addCollaboratorDto: AddCollaboratorDto,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.documentsService.addCollaborator(
      id,
      addCollaboratorDto,
      user,
    );
  }

  @Version('1')
  @Post('collaborators/accept/:token')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiConsumes('application/json')
  async acceptInvitation(
    @Param('token') token: string,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.documentsService.acceptInvitation(token, user);
  }

  @Version('1')
  @Get(':id/get-collaborators')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async getCollaborators(
    @Param('id') id: string,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.documentsService.getCollaborators(id, user);
  }

  @Version('1')
  @Get('/invite-validate/:token')
  @ApiConsumes('application/json')
  async validateInvitation(@Param('token') token: string) {
    return await this.documentsService.validateInvitation(token);
  }

  @Version('1')
  @Patch(':id/collaborators/:collaboratorId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async updateCollaboratorRole(
    @Param('id') id: string,
    @Param('collaboratorId') collaboratorId: string,
    @Body() updateDto: UpdateCollaboratorRoleDto,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.documentsService.updateCollaboratorRole(
      id,
      collaboratorId,
      updateDto,
      user,
    );
  }

  @Version('1')
  @Delete(':id/collaborators/:collabId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async removeCollaborator(
    @Param('id') documentId: string,
    @Param('collabId') collabId: string,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.removeCollaborator(documentId, collabId, user);
  }

  @Version('1')
  @Get('shared/:shareToken')
  @ApiConsumes('application/json')
  async getDocumentByShareToken(
    @Param('shareToken') shareToken: string,
    @LoginUser() user?: AuthenticatedUser,
  ) {
    return this.documentsService.getDocumentByShareToken(shareToken, user);
  }
}
