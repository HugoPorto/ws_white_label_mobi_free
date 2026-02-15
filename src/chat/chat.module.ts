import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Chat } from './chat.entity';
import { User } from 'src/users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketModule } from 'src/socket/socket.module';
import { ClientRequestsModule } from 'src/client_requests/client_requests.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Chat, User]),
        SocketModule,
        ClientRequestsModule
    ],
    providers: [ChatService],
    controllers: [ChatController]
})
export class ChatModule { }
