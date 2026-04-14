import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { SessionRecordingService, SessionRecording } from './session-recording.service';

@Controller('recordings')
export class SessionRecordingController {
    private readonly logger = new Logger(SessionRecordingController.name);

    constructor(private recordingService: SessionRecordingService) { }

    @Post('start')
    async startRecording(@Body() body: { sessionId: string; childId: string; concept: string }) {
        return this.recordingService.startRecording(body.sessionId, body.childId, body.concept);
    }

    @Post('event')
    async addEvent(@Body() body: { sessionId: string; type: string; content: string; phase: string }) {
        this.recordingService.addEvent(body.sessionId, {
            type: body.type as any,
            content: body.content,
            phase: body.phase
        });
        return { status: 'recorded' };
    }

    @Post(':sessionId/end')
    async endRecording(
        @Param('sessionId') sessionId: string,
        @Body() body: { masteryScore?: number }
    ) {
        return this.recordingService.endRecording(sessionId, body.masteryScore);
    }

    @Get(':sessionId')
    async getRecording(@Param('sessionId') sessionId: string) {
        return this.recordingService.getRecording(sessionId);
    }

    @Get('child/:childId')
    async getChildRecordings(@Param('childId') childId: string) {
        return this.recordingService.getRecordingsByChild(childId);
    }

    @Get('recent')
    async getRecent(@Query('limit') limit: string = '10') {
        return this.recordingService.getRecentRecordings(parseInt(limit));
    }
}
