import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
  namespace: '/leaderboard',
})
export class LeaderboardGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => LeaderboardService))
    private leaderboard: LeaderboardService,
  ) {}

  async handleConnection(_client: Socket) {
    const top10 = await this.leaderboard.getTop10();
    _client.emit('leaderboard:snapshot', top10);
  }

  @SubscribeMessage('leaderboard:get')
  async handleGet(client: Socket) {
    const top10 = await this.leaderboard.getTop10();
    client.emit('leaderboard:snapshot', top10);
  }

  async broadcastUpdate() {
    if (!this.server) return;
    const top10 = await this.leaderboard.getTop10();
    this.server.emit('leaderboard:update', top10);
  }
}
