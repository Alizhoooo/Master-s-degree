import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('documents.access')
@ApiBearerAuth()
export class DocumentController {
  constructor(private documents: DocumentService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'posted', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  listDocuments(
    @Query('type') type?: string,
    @Query('posted') posted?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.documents.listDocuments({
      type,
      posted: posted ? posted === 'true' : undefined,
      customerId: customerId ? +customerId : undefined,
    });
  }
  @Get(':id') getDocument(@Param('id') id: string) { return this.documents.getDocument(+id); }
  @Post() createDocument(@Body() body: any, @Request() req) { return this.documents.createDocument(body, req.user.id); }
  @Patch(':id') updateDocument(@Param('id') id: string, @Body() body: any, @Request() req) { return this.documents.updateDocument(+id, body, req.user.id); }
  @Patch(':id/post') postDocument(@Param('id') id: string, @Request() req) { return this.documents.postDocument(+id, req.user.id); }
  @Patch(':id/unpost') unpostDocument(@Param('id') id: string, @Request() req) { return this.documents.unpostDocument(+id, req.user.id); }
  @Delete(':id') deleteDocument(@Param('id') id: string) { return this.documents.deleteDocument(+id); }

  @Get(':id/versions') listVersions(@Param('id') id: string) { return this.documents.listVersions(+id); }
  @Get(':id/approvals') listApprovals(@Param('id') id: string) { return this.documents.listApprovals(+id); }
  @Post(':id/approvals') requestApproval(@Param('id') id: string, @Body() body: { approverId: number }) {
    return this.documents.requestApproval(+id, body.approverId);
  }
  @Patch('approvals/:id/decide') decideApproval(@Param('id') id: string, @Body() body: { status: 'Approved' | 'Rejected'; comment: string }) {
    return this.documents.decideApproval(+id, body.status, body.comment);
  }

  @Get(':id/attachments') listAttachments(@Param('id') id: string) { return this.documents.listAttachments(+id); }
  @Get('attachments/:id/download') async getAttachment(@Param('id') id: string, @Res() res: any) {
    const att = await this.documents.getAttachment(+id);
    if (!att) return res.status(404).send('Not found');
    res.setHeader('Content-Type', att.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${att.filename}"`);
    res.send(att.data);
  }
  @Post(':id/attachments') addAttachment(
    @Param('id') id: string,
    @Body() body: { filename: string; contentType: string; size: number; dataBase64: string },
  ) {
    const data = Buffer.from(body.dataBase64, 'base64');
    return this.documents.addAttachment(+id, body.filename, body.contentType, body.size, data);
  }
}
