import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws/inventory',
})
export class InventoryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit() {}

  handleConnection(client: Socket) {
    client.join('inventory-room');
  }

  handleDisconnect() {}

  emitStockUpdated(productId: number, product: any) {
    this.server.to('inventory-room').emit('stockUpdated', { productId, product });
  }

  emitReservationCompleted(result: { reserved: number; total: number }) {
    this.server.to('inventory-room').emit('reservationCompleted', result);
  }
}
