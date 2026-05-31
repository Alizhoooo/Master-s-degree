import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('CRM')
@Controller('crm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get('customers')
  @ApiOperation({ summary: 'List all customers' })
  findAllCustomers() {
    return this.crmService.findAllCustomers();
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer details with orders, logs, complaints' })
  @ApiParam({ name: 'id', type: Number })
  findOneCustomer(@Param('id') id: string) {
    return this.crmService.findOneCustomer(+id);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create new customer' })
  createCustomer(@Body() body: { company: string; contactPerson: string; phone: string; email: string; tier?: string }) {
    return this.crmService.createCustomer(body);
  }

  @Post('customers/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import customers from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  importCustomers(@UploadedFile() file: Express.Multer.File) {
    return this.crmService.importCustomers(file);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'id', type: Number })
  updateCustomer(@Param('id') id: string, @Body() body: { company?: string; contactPerson?: string; phone?: string; email?: string; tier?: string }) {
    return this.crmService.updateCustomer(+id, body);
  }

  @Post('customers/:id/contact-log')
  @ApiOperation({ summary: 'Add contact log entry' })
  @ApiParam({ name: 'id', type: Number })
  addContactLog(@Param('id') id: string, @Body() body: { note: string }) {
    return this.crmService.addContactLog(+id, body.note);
  }

  @Get('complaints')
  @ApiOperation({ summary: 'List all complaints' })
  findAllComplaints() {
    return this.crmService.findAllComplaints();
  }

  @Post('complaints')
  @ApiOperation({ summary: 'Create new complaint' })
  createComplaint(@Body() body: { customerId: number; title: string; description: string }) {
    return this.crmService.createComplaint(body);
  }

  @Patch('complaints/:id/status')
  @ApiOperation({ summary: 'Update complaint status' })
  @ApiParam({ name: 'id', type: Number })
  updateComplaintStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.crmService.updateComplaintStatus(+id, body.status);
  }
}
