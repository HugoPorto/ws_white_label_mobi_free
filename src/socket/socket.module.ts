import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { jwtConstants } from 'src/auth/jwt/jwt.constants';
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '2d' },
        })
    ],
    providers: [SocketGateway, WsJwtGuard],
    exports: [SocketGateway]
})
export class SocketModule {}
