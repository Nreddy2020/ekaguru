import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CognitiveLoopService, SessionState } from './cognitive-loop.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SessionGateway.name);

    constructor(private cognitiveLoopService: CognitiveLoopService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-session')
    async handleJoinSession(client: Socket, payload: { sessionId: string }) {
        client.join(payload.sessionId);
        this.logger.log(`Client ${client.id} joined session ${payload.sessionId}`);
        return { event: 'joined', data: { sessionId: payload.sessionId } };
    }

    @SubscribeMessage('leave-session')
    handleLeaveSession(client: Socket, payload: { sessionId: string }) {
        client.leave(payload.sessionId);
        return { event: 'left', data: { sessionId: payload.sessionId } };
    }

    @SubscribeMessage('student-response')
    async handleStudentResponse(client: Socket, payload: { sessionId: string; response: string }) {
        const result = await this.cognitiveLoopService.processStudentResponse(
            payload.sessionId,
            payload.response
        );

        this.server.to(payload.sessionId).emit('phase-update', {
            sessionId: payload.sessionId,
            phase: result.nextPhase,
            content: result.content
        });

        return { event: 'response-processed', data: result };
    }

    @SubscribeMessage('get-session-state')
    async handleGetSessionState(client: Socket, payload: { sessionId: string }) {
        const session = await this.cognitiveLoopService.getSession(payload.sessionId);
        return { event: 'session-state', data: session };
    }

    broadcastPhaseChange(sessionId: string, phase: string, content: any) {
        this.server.to(sessionId).emit('phase-update', {
            sessionId,
            phase,
            content
        });
    }

    broadcastSessionEnd(sessionId: string) {
        this.server.to(sessionId).emit('session-ended', {
            sessionId
        });
    }
}
