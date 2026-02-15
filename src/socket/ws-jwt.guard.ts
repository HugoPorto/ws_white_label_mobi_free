import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { jwtConstants } from 'src/auth/jwt/jwt.constants';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            
            // Se o usuário já foi autenticado durante a conexão, permite acesso
            if (client.data.user) {
                this.logger.log(`✅ Usuário já autenticado: ${client.data.user.username} (ID: ${client.data.user.userId})`);
                return true;
            }
            
            // Caso contrário, tenta autenticar (fallback)
            const token = this.extractTokenFromHandshake(client);

            if (!token) {
                throw new WsException('Token não fornecido');
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: jwtConstants.secret
            });

            // Anexa os dados do usuário ao socket para uso posterior
            client.data.user = {
                userId: payload.id,
                username: payload.name,
                roles: payload.roles
            };

            this.logger.log(`✅ Usuário autenticado via WebSocket: ${payload.name} (ID: ${payload.id})`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Erro na autenticação WebSocket: ${error.message}`);
            throw new WsException('Token inválido ou expirado');
        }
    }

    private extractTokenFromHandshake(client: Socket): string | null {
        // Tenta extrair o token de diferentes locais
        const authHeader = client.handshake?.headers?.authorization;
        const queryToken = client.handshake?.query?.token as string;
        const authToken = client.handshake?.auth?.token as string;

        // Prioridade: Authorization header > query param > auth object
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        if (queryToken) {
            return queryToken;
        }

        if (authToken) {
            return authToken;
        }

        return null;
    }
}
