import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { SocketGateway } from 'src/socket/socket.gateway';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatService } from './chat.service';
import { ClientRequestsService } from 'src/client_requests/client_requests.service';

@Controller('chat')
export class ChatController {
    constructor(
        private chatService: ChatService,
        private socketGateway: SocketGateway,
        private clientRequestsService: ClientRequestsService
    ) { }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post() // http://[address]/chat -> POST 
    create(@Body() chat: CreateChatDto) {
        const createdChat = this.chatService.create(chat);
        this.socketGateway.server.emit('chat_message_emit', createdChat);
        return createdChat;
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client_request/:id_user/:role') // http://[address]/chat/client_request/:id_user/:role -> GET
    findByUserId(@Param('id_user') id_user: number, @Param('role') role: JwtRole) {
        if (role === JwtRole.CLIENT) {
            return this.clientRequestsService.getActiveByClient(Number(id_user));
        } else {
            return this.clientRequestsService.getActiveByDriver(Number(id_user));
        }
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('messages/:id_client_request') // http://[address]/chat/messages/:id_client_request -> GET
    findByClientRequest(@Param('id_client_request') id_client_request: number) {
        return this.chatService.findByClientRequest(Number(id_client_request));
    }
}