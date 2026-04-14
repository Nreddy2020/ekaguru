import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { CognitiveLoopService, SessionState } from './cognitive-loop.service';

@Controller('session')
export class CognitiveLoopController {
    private readonly logger = new Logger(CognitiveLoopController.name);

    constructor(private readonly cognitiveLoopService: CognitiveLoopService) { }

    @Post('start')
    async startSession(@Body() body: { studentId: string; concept: string }) {
        this.logger.log(`Starting session for student ${body.studentId}, concept: ${body.concept}`);
        const session = await this.cognitiveLoopService.startSession(body.studentId, body.concept);
        return session;
    }

    @Get(':sessionId')
    async getSession(@Param('sessionId') sessionId: string) {
        const session = await this.cognitiveLoopService.getSession(sessionId);
        if (!session) {
            return { error: 'Session not found' };
        }
        return session;
    }

    @Post('respond')
    async processResponse(@Body() body: { sessionId: string; response: string }) {
        this.logger.log(`Processing response for session ${body.sessionId}`);
        const result = await this.cognitiveLoopService.processStudentResponse(body.sessionId, body.response);
        return result;
    }

    @Post(':sessionId/end')
    async endSession(@Param('sessionId') sessionId: string) {
        await this.cognitiveLoopService.endSession(sessionId);
        return { status: 'ended', sessionId };
    }

    @Get()
    async getActiveSessions() {
        const sessions = await this.cognitiveLoopService.getActiveSessions();
        return { sessions };
    }
}
