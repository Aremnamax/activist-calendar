import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('events/:eventId')
  async subscribe(@Param('eventId') eventId: string, @Request() req) {
    return this.subscriptionsService.subscribe(req.user.id, +eventId);
  }

  @Delete('events/:eventId')
  async unsubscribe(@Param('eventId') eventId: string, @Request() req) {
    await this.subscriptionsService.unsubscribe(req.user.id, +eventId);
    return { success: true };
  }

  @Get('my')
  async getMySubscriptions(@Request() req) {
    return this.subscriptionsService.findByUser(req.user.id);
  }
}
