import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Query, 
    ParseIntPipe, 
    HttpCode, 
    HttpStatus 
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Messages } from './messages.entity';
import { MessageRead } from './message-reads.entity';

/**
 * DTOs para validação de requisições
 */
class CreateMessageDto {
    createdByAdminId: number;
    createdByAdminName: string;
    senderRole: 'admin' | 'system' | 'moderator';
    targetType: 'all_users' | 'specific_user' | 'user_group' | 'role_based';
    targetUserId?: number;
    targetUserIds?: number[];
    targetRole?: 'driver' | 'passenger' | 'both';
    title: string;
    message: string;
    shortPreview?: string;
    category: 'info' | 'warning' | 'alert' | 'update' | 'maintenance' | 'promotion';
    priority: 'low' | 'medium' | 'high';
    isDismissible?: boolean;
    requiresAcknowledgment?: boolean;
    expiresAt?: Date;
    isActive?: boolean;
    actionButton?: { text: string; link?: string; action?: string };
    scheduledFor?: Date;
    sendImmediately?: boolean;
    repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
    repeatUntil?: Date;
    attachments?: { url: string; type?: 'image' | 'pdf' | 'other'; name?: string }[];
    icon?: string;
    iconColor?: string;
    imageUrl?: string;
    tags?: string[];
}

class UpdateMessageDto {
    title?: string;
    message?: string;
    shortPreview?: string;
    category?: 'info' | 'warning' | 'alert' | 'update' | 'maintenance' | 'promotion';
    priority?: 'low' | 'medium' | 'high';
    isDismissible?: boolean;
    requiresAcknowledgment?: boolean;
    expiresAt?: Date;
    isActive?: boolean;
    actionButton?: { text: string; link?: string; action?: string };
    scheduledFor?: Date;
    attachments?: { url: string; type?: 'image' | 'pdf' | 'other'; name?: string }[];
    icon?: string;
    iconColor?: string;
    imageUrl?: string;
}

class MarkAsReadDto {
    userId: number;
    deviceInfo?: any;
}

class AcknowledgeDto {
    userId: number;
}

class AddTagsDto {
    tags: string[];
}

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    /**
     * Cria uma nova mensagem
     * POST /messages
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createDto: CreateMessageDto): Promise<Messages> {
        const messageData: any = {
            ...createDto,
            createdByAdmin: { id: createDto.createdByAdminId } as any,
        };

        if (createDto.targetUserId) {
            messageData.targetUser = { id: createDto.targetUserId } as any;
        }

        // Remove os IDs que já foram convertidos em relações
        delete messageData.createdByAdminId;
        delete messageData.targetUserId;

        return this.messagesService.create(messageData);
    }

    /**
     * Busca uma mensagem por ID
     * GET /messages/:id
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Messages> {
        return this.messagesService.findOne(id);
    }

    /**
     * Busca mensagem por código
     * GET /messages/code/:messageCode
     */
    @Get('code/:messageCode')
    async findByCode(@Param('messageCode') messageCode: string): Promise<Messages> {
        return this.messagesService.findByCode(messageCode);
    }

    /**
     * Busca mensagens ativas para um usuário
     * GET /messages/user/:userId/active
     * Query params: category, priority, unreadOnly
     */
    @Get('user/:userId/active')
    async findActiveForUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('category') category?: string,
        @Query('priority') priority?: string,
        @Query('unreadOnly') unreadOnly?: string,
    ): Promise<Messages[]> {
        return this.messagesService.findActiveForUser(userId, {
            category,
            priority,
            unreadOnly: unreadOnly === 'true',
        });
    }

    /**
     * Busca mensagens por tipo de destinatário
     * GET /messages/target-type/:type
     */
    @Get('target-type/:type')
    async findByTargetType(
        @Param('type') type: 'all_users' | 'specific_user' | 'user_group' | 'role_based'
    ): Promise<Messages[]> {
        return this.messagesService.findByTargetType(type);
    }

    /**
     * Busca mensagens por categoria e prioridade
     * GET /messages/filter/category-priority
     * Query params: category, priority
     */
    @Get('filter/category-priority')
    async findByCategoryAndPriority(
        @Query('category') category: string,
        @Query('priority') priority: string,
    ): Promise<Messages[]> {
        return this.messagesService.findByCategoryAndPriority(category, priority);
    }

    /**
     * Busca mensagens agendadas pendentes
     * GET /messages/scheduled/pending
     */
    @Get('scheduled/pending')
    async findScheduledPending(): Promise<Messages[]> {
        return this.messagesService.findScheduledPending();
    }

    /**
     * Busca mensagens expiradas ainda ativas
     * GET /messages/expired/active
     */
    @Get('expired/active')
    async findExpiredActive(): Promise<Messages[]> {
        return this.messagesService.findExpiredActive();
    }

    /**
     * Busca mensagens que requerem confirmação para um usuário
     * GET /messages/user/:userId/requiring-acknowledgment
     */
    @Get('user/:userId/requiring-acknowledgment')
    async findRequiringAcknowledgment(
        @Param('userId', ParseIntPipe) userId: number
    ): Promise<Messages[]> {
        return this.messagesService.findRequiringAcknowledgment(userId);
    }

    /**
     * Atualiza uma mensagem
     * PUT /messages/:id
     */
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMessageDto,
    ): Promise<Messages> {
        return this.messagesService.update(id, updateDto);
    }

    /**
     * Ativa uma mensagem
     * PUT /messages/:id/activate
     */
    @Put(':id/activate')
    async activate(@Param('id', ParseIntPipe) id: number): Promise<Messages> {
        return this.messagesService.activate(id);
    }

    /**
     * Desativa uma mensagem
     * PUT /messages/:id/deactivate
     */
    @Put(':id/deactivate')
    async deactivate(@Param('id', ParseIntPipe) id: number): Promise<Messages> {
        return this.messagesService.deactivate(id);
    }

    /**
     * Publica uma mensagem agendada
     * POST /messages/:id/publish
     */
    @Post(':id/publish')
    async publish(@Param('id', ParseIntPipe) id: number): Promise<Messages> {
        return this.messagesService.publish(id);
    }

    /**
     * Marca uma mensagem como lida
     * POST /messages/:id/read
     */
    @Post(':id/read')
    async markAsRead(
        @Param('id', ParseIntPipe) id: number,
        @Body() markAsReadDto: MarkAsReadDto,
    ): Promise<MessageRead> {
        return this.messagesService.markAsRead(
            id,
            markAsReadDto.userId,
            markAsReadDto.deviceInfo,
        );
    }

    /**
     * Confirma/reconhece uma mensagem
     * POST /messages/:id/acknowledge
     */
    @Post(':id/acknowledge')
    async acknowledge(
        @Param('id', ParseIntPipe) id: number,
        @Body() acknowledgeDto: AcknowledgeDto,
    ): Promise<MessageRead> {
        return this.messagesService.acknowledge(id, acknowledgeDto.userId);
    }

    /**
     * Busca status de leitura de uma mensagem para um usuário
     * GET /messages/:id/read-status/:userId
     */
    @Get(':id/read-status/:userId')
    async getReadStatus(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<MessageRead | null> {
        return this.messagesService.getReadStatus(id, userId);
    }

    /**
     * Adiciona tags a uma mensagem
     * POST /messages/:id/tags
     */
    @Post(':id/tags')
    async addTags(
        @Param('id', ParseIntPipe) id: number,
        @Body() addTagsDto: AddTagsDto,
    ): Promise<Messages> {
        return this.messagesService.addTags(id, addTagsDto.tags);
    }

    /**
     * Remove tags de uma mensagem
     * DELETE /messages/:id/tags
     */
    @Delete(':id/tags')
    async removeTags(
        @Param('id', ParseIntPipe) id: number,
        @Body() removeTagsDto: AddTagsDto,
    ): Promise<Messages> {
        return this.messagesService.removeTags(id, removeTagsDto.tags);
    }

    /**
     * Incrementa o contador de visualizações
     * PUT /messages/:id/view
     */
    @Put(':id/view')
    @HttpCode(HttpStatus.NO_CONTENT)
    async incrementViewCount(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.messagesService.incrementViewCount(id);
    }

    /**
     * Soft delete de uma mensagem
     * DELETE /messages/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.messagesService.softDelete(id);
    }

    /**
     * Restaura uma mensagem deletada
     * PUT /messages/:id/restore
     */
    @Put(':id/restore')
    async restore(@Param('id', ParseIntPipe) id: number): Promise<Messages> {
        return this.messagesService.restore(id);
    }

    /**
     * Busca estatísticas de uma mensagem
     * GET /messages/:id/stats
     */
    @Get(':id/stats')
    async getMessageStats(@Param('id', ParseIntPipe) id: number): Promise<{
        message: Messages;
        recipientCount: number;
        viewCount: number;
        readCount: number;
        acknowledgmentCount: number;
        readPercentage: number;
        acknowledgmentPercentage: number;
    }> {
        return this.messagesService.getMessageStats(id);
    }

    /**
     * Busca estatísticas gerais do sistema de mensagens
     * GET /messages/stats/general
     */
    @Get('stats/general')
    async getGeneralStats(): Promise<{
        totalMessages: number;
        activeMessages: number;
        scheduledMessages: number;
        expiredMessages: number;
        totalReads: number;
        totalAcknowledgments: number;
        averageReadRate: number;
        byCategory: Record<string, number>;
        byPriority: Record<string, number>;
    }> {
        return this.messagesService.getGeneralStats();
    }
}
