import { 
    Body, 
    Controller, 
    Delete, 
    Get, 
    Param, 
    Post, 
    Put, 
    UseGuards 
} from '@nestjs/common';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { ChatIdentifyService } from './chat_identify.service';
import { CreateChatIdentifyDto } from './dto/create-chat-identify.dto';
import { UpdateChatIdentifyDto } from './dto/update-chat-identify.dto';

@Controller('chat-identify')
export class ChatIdentifyController {
    constructor(
        private readonly chatIdentifyService: ChatIdentifyService
    ) { }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post() // http://[address]/chat-identify -> POST
    create(@Body() createChatIdentifyDto: CreateChatIdentifyDto) {
        return this.chatIdentifyService.create(createChatIdentifyDto);
    }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get() // http://[address]/chat-identify -> GET
    findAll() {
        return this.chatIdentifyService.findAll();
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':id') // http://[address]/chat-identify/:id -> GET
    findOne(@Param('id') id: string) {
        return this.chatIdentifyService.findOne(+id);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('code/:code') // http://[address]/chat-identify/code/:code -> GET
    findByCode(@Param('code') code: string) {
        return this.chatIdentifyService.findByCode(code);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('user/:id_user') // http://[address]/chat-identify/user/:id_user -> GET
    findByUser(@Param('id_user') id_user: string) {
        return this.chatIdentifyService.findByUser(+id_user);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client-request/:id_client_request') // http://[address]/chat-identify/client-request/:id_client_request -> GET
    findByClientRequest(@Param('id_client_request') id_client_request: string) {
        return this.chatIdentifyService.findByClientRequest(+id_client_request);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put(':id') // http://[address]/chat-identify/:id -> PUT
    update(@Param('id') id: string, @Body() updateChatIdentifyDto: UpdateChatIdentifyDto) {
        return this.chatIdentifyService.update(+id, updateChatIdentifyDto);
    }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Delete(':id') // http://[address]/chat-identify/:id -> DELETE
    remove(@Param('id') id: string) {
        return this.chatIdentifyService.remove(+id);
    }
}
