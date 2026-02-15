import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket} from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './ws-jwt.guard';
import { jwtConstants } from 'src/auth/jwt/jwt.constants';

@WebSocketGateway({
    cors: {
        origin: '*'
    },
    transports: ['websocket']
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(SocketGateway.name);

    @WebSocketServer() server: Server;

    async handleConnection(client: Socket, ...args: any[]) {
        try {
            this.logger.log(`🔌 Nova conexão recebida: ${client.id}`);
            this.logger.log(`📋 Headers: ${JSON.stringify(client.handshake.headers)}`);
            this.logger.log(`📋 Query: ${JSON.stringify(client.handshake.query)}`);
            this.logger.log(`📋 Auth: ${JSON.stringify(client.handshake.auth)}`);
            
            // Extrai o token do handshake
            const token = this.extractToken(client);
            
            if (!token) {
                this.logger.warn(`❌ Conexão rejeitada - Token não fornecido: ${client.id}`);
                client.disconnect();
                return;
            }

            this.logger.log(`🔑 Token extraído (primeiros 20 chars): ${token.substring(0, 20)}...`);
            this.logger.log(`🔑 Token completo length: ${token.length}`);

            // Valida o token JWT
            const jwtService = new JwtService({ secret: jwtConstants.secret });
            this.logger.log(`🔐 Tentando validar token...`);
            const payload = await jwtService.verifyAsync(token);
            
            // Salva os dados do usuário no socket para uso posterior
            client.data.user = {
                userId: payload.id,
                username: payload.name,
                roles: payload.roles
            };

            this.logger.log(`✅ Usuário autenticado conectado ao SOCKET: ${client.id}`);
            this.logger.log(`👤 Usuário: ${payload.name} (ID: ${payload.id})`);
            this.logger.log(`📊 Total de sockets conectados: ${this.server.sockets.sockets.size}`);
        } catch (error) {
            this.logger.error(`❌ Erro na conexão/autenticação: ${error.message}`);
            this.logger.error(`❌ Stack: ${error.stack}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const username = client.data.user?.username || 'desconhecido';
        this.logger.log(`Usuário ${username} se desconectou do SOCKET.IO: ${client.id}`);
        this.server.emit('driver_disconnected', { id_socket: client.id });
    }

    private extractToken(client: Socket): string | null {
        const authHeader = client.handshake?.headers?.authorization;
        const queryToken = client.handshake?.query?.token as string;
        const authToken = client.handshake?.auth?.token as string;

        this.logger.log(`🔍 Extraindo token...`);
        this.logger.log(`🔍 authHeader: ${authHeader}`);
        this.logger.log(`🔍 queryToken: ${queryToken}`);
        this.logger.log(`🔍 authToken: ${authToken}`);

        // Prioridade: auth object > query param > Authorization header
        // Isso evita o problema do duplo "Bearer " no header
        
        if (authToken) {
            // Remove "Bearer " se existir
            const cleaned = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
            this.logger.log(`✅ Token extraído do auth object (length: ${cleaned.length})`);
            return cleaned;
        }

        if (queryToken) {
            const cleaned = queryToken.startsWith('Bearer ') ? queryToken.substring(7) : queryToken;
            this.logger.log(`✅ Token extraído do query param (length: ${cleaned.length})`);
            return cleaned;
        }

        if (authHeader) {
            // Remove "Bearer " quantas vezes aparecer
            let cleaned = authHeader;
            while (cleaned.startsWith('Bearer ')) {
                cleaned = cleaned.substring(7);
            }
            this.logger.log(`✅ Token extraído do Authorization header (length: ${cleaned.length})`);
            return cleaned;
        }

        this.logger.warn(`❌ Nenhum token encontrado em nenhum local`);
        return null;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('message')
    handleMessage(@MessageBody() data: any) {
        this.logger.log(`Nova mensagem: ${JSON.stringify(data)}`);
        this.server.emit('new_message', data);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('change_driver_position')
    handleChangeDriverPosition(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.logger.log(`🚗[GATEWAY] RECEBEU NOVA POSIÇÃO DO MOTORISTA`);
        this.logger.log(`🚗[GATEWAY] Socket ID: ${client.id}`);
        this.logger.log(`🚗[GATEWAY] ID Motorista: ${data.id}`);
        this.logger.log(`🚗[GATEWAY] Posição: lat=${data.lat}, lng=${data.lng}, typeVehicle=${data.typeVehicle}`);
        
        const broadcastData = {
            id_socket: client.id,
            id: data.id,
            lat: data.lat,
            lng: data.lng,
            typeVehicle: data.typeVehicle
        };
        
        this.logger.log(`📡[GATEWAY] Fazendo BROADCAST de new_driver_position para TODOS clientes`);
        this.logger.log(`📡[GATEWAY] Dados do broadcast: ${JSON.stringify(broadcastData)}`);
        this.logger.log(`📡[GATEWAY] Total de sockets conectados: ${this.server.sockets.sockets.size}`);
        
        this.server.emit('new_driver_position', broadcastData);
        
        this.logger.log(`✅[GATEWAY] Broadcast de new_driver_position enviado!`);
    }

    // EMITE NOVA SOLICITAÇÃO DE CLIENTE VIA SOCKET
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('new_client_request')
    handleNewClientRequest(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.server.emit('created_client_request', { id_socket: client.id, id_client_request: data.id_client_request });
    }

    // EMITE NOVA OFERTA DE MOTORISTA VIA SOCKET
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('new_driver_offer')
    handleNewDriverOffer(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.logger.log(`ID CLIENTE SOLICITA OFERTA DO MOTORISTA: ${data.id_client_request}`);
        this.logger.log(`EMITIU NOVA OFERTA DE MOTORISTA: ${JSON.stringify(data)}`);
        this.server.emit(`created_driver_offer/${data.id_client_request}`, { id_socket: client.id, client_request_type: data.client_request_type, id_client_request: data.id_client_request, accept: data.accept });
    }

    // EMITE MOTORISTA ATRIBUÍDO VIA SOCKET
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('new_driver_assigned')
    handleNewDriverAssigned(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.server.emit(`driver_assigned/${data.id_driver}`, { id_socket: client.id, id_client_request: data.id_client_request });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('trip_change_driver_position')
    handleTripChangeDriverPosition(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.server.emit(`trip_new_driver_position/${data.id_client}`, { id_socket: client.id, lat: data.lat, lng: data.lng });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('update_status_trip')
    handleUpdateStatusTrip(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.server.emit(`new_status_trip/${data.id_client_request}`, { id_socket: client.id, status: data.status, id_client_request: data.id_client_request });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('pps_idp')
    handlePPS(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.logger.log('🔥 PPS_IDP recebido:', data);
        this.logger.log('🔗 Cliente ID:', client.id);
        this.server.emit('pps', data);
        this.logger.log('✅ PPS emitido para todos os clientes');
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('pps_idp2')
    handlePPS2(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.logger.log('🔥 PPS_IDP2 recebido:', data);
        this.logger.log('🔗 Cliente ID:', client.id);
        this.server.emit('pps2', data);
        this.logger.log('✅ PPS2 emitido para todos os clientes');
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('chat_message_driver')
    handleChatMessageDriver(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.logger.log('🔥 Chat message recebido:', data);
        this.logger.log('🔗 Cliente ID:', client.id);
        this.server.emit('chat_message_emit_driver', data);
        this.logger.log('✅ Chat message emitido para todos os clientes');
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('chat_message_client')
    handleChatMessageClient(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        this.logger.log('🔥 Chat message recebido:', data);
        this.logger.log('🔗 Cliente ID:', client.id);
        this.server.emit('chat_message_emit_client', data);
        this.logger.log('✅ Chat message emitido para todos os clientes');
    }
}