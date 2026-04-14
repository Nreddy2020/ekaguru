import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('parent')
export class ParentController {
    private readonly logger = new Logger(ParentController.name);

    constructor(private readonly userService: UserService) { }

    @Post('register')
    async registerParent(@Body() body: { email: string; name: string }) {
        this.logger.log(`Registering parent: ${body.email}`);
        const parent = await this.userService.createParent(body.email, body.name);
        return parent;
    }

    @Get(':parentId')
    async getParent(@Param('parentId') parentId: string) {
        return await this.userService.getParent(parentId);
    }

    @Get(':parentId/children')
    async getChildren(@Param('parentId') parentId: string) {
        return await this.userService.getChildren(parentId);
    }

    @Post(':parentId/children')
    async addChild(
        @Param('parentId') parentId: string,
        @Body() body: { name: string; age: number }
    ) {
        return await this.userService.addChild(parentId, body.name, body.age);
    }

    @Get('child/:childId/progress')
    async getChildProgress(@Param('childId') childId: string) {
        return await this.userService.getChildProgress(childId);
    }

    @Post('consent')
    async recordConsent(@Body() body: { parentId: string; consented: boolean }) {
        return await this.userService.recordConsent(body.parentId, body.consented);
    }

    @Get('consent/:parentId')
    async getConsentStatus(@Param('parentId') parentId: string) {
        return await this.userService.getConsentStatus(parentId);
    }

    @Get('child/:childId/trend')
    async getFearConfidenceTrend(
        @Param('childId') childId: string,
        @Query('days') days: string = '7'
    ) {
        return await this.userService.getFearConfidenceTrend(childId, parseInt(days));
    }

    @Get(':parentId/analytics')
    async getParentAnalytics(@Param('parentId') parentId: string) {
        return await this.userService.getParentAnalytics(parentId);
    }
}
