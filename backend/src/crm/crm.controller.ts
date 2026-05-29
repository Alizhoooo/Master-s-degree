import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get('customers')
  findAllCustomers() {
    return this.crmService.findAllCustomers();
  }

  @Get('customers/:id')
  findOneCustomer(@Param('id') id: string) {
    return this.crmService.findOneCustomer(+id);
  }

  @Post('customers')
  createCustomer(@Body() body: { company: string; contactPerson: string; phone: string; email: string; tier?: string }) {
    return this.crmService.createCustomer(body);
  }

  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() body: { company?: string; contactPerson?: string; phone?: string; email?: string; tier?: string }) {
    return this.crmService.updateCustomer(+id, body);
  }

  @Post('customers/:id/contact-log')
  addContactLog(@Param('id') id: string, @Body() body: { note: string }) {
    return this.crmService.addContactLog(+id, body.note);
  }

  @Get('complaints')
  findAllComplaints() {
    return this.crmService.findAllComplaints();
  }

  @Post('complaints')
  createComplaint(@Body() body: { customerId: number; title: string; description: string }) {
    return this.crmService.createComplaint(body);
  }

  @Patch('complaints/:id/status')
  updateComplaintStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.crmService.updateComplaintStatus(+id, body.status);
  }
}
