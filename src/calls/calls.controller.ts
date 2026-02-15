import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CallsService } from './calls.service';
import { Calls } from './calls.entity';

// DTOs
class CreateCallDto {
    userId: number;
    userEmail: string;
    userPhone?: string;
    title: string;
    description: string;
    category: 'technical' | 'payment' | 'account' | 'safety' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deviceInfo?: {
        platform?: string;
        osVersion?: string;
        deviceModel?: string;
        deviceId?: string;
    };
    appVersion?: string;
    attachments?: {
        url: string;
        type?: 'image' | 'pdf' | 'document' | 'other';
        name?: string;
        size?: number;
    }[];
}

class AssignAgentDto {
    agentId: number;
    agentName: string;
}

class AddResponseDto {
    response: string;
}

class ResolveCallDto {
    resolution: string;
}

class AddRatingDto {
    rating: number;
    feedback?: string;
}

class AddNotesDto {
    notes: string;
}

class AddTagsDto {
    tags: string[];
}

class RelateTicketDto {
    relatedTicketId: number;
}

@Controller('calls')
export class CallsController {
    constructor(private readonly callsService: CallsService) {}

    // ==================== CRIAR ====================

    /**
     * POST /calls
     * Criar novo chamado
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCallDto: CreateCallDto): Promise<Calls> {
        return await this.callsService.create(createCallDto);
    }

    // ==================== BUSCAR ====================

    /**
     * GET /calls/:id
     * Buscar chamado por ID
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Calls> {
        return await this.callsService.findOne(id);
    }

    /**
     * GET /calls/ticket/:ticketNumber
     * Buscar chamado por número do ticket
     */
    @Get('ticket/:ticketNumber')
    async findByTicketNumber(@Param('ticketNumber') ticketNumber: string): Promise<Calls> {
        return await this.callsService.findByTicketNumber(ticketNumber);
    }

    /**
     * GET /calls/user/:userId
     * Buscar chamados de um usuário (com filtros opcionais)
     */
    @Get('user/:userId')
    async findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('status') status?: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed',
        @Query('category') category?: string,
        @Query('priority') priority?: string
    ): Promise<Calls[]> {
        return await this.callsService.findByUser(userId, {
            status,
            category,
            priority
        });
    }

    /**
     * GET /calls/user/:userId/open
     * Buscar chamados abertos de um usuário
     */
    @Get('user/:userId/open')
    async findOpenByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Calls[]> {
        return await this.callsService.findOpenByUser(userId);
    }

    /**
     * GET /calls/agent/:agentId
     * Buscar chamados atribuídos a um atendente
     */
    @Get('agent/:agentId')
    async findByAgent(@Param('agentId', ParseIntPipe) agentId: number): Promise<Calls[]> {
        return await this.callsService.findByAgent(agentId);
    }

    /**
     * GET /calls/urgent/unassigned
     * Buscar chamados urgentes não atribuídos
     */
    @Get('urgent/unassigned')
    async findUrgentUnassigned(): Promise<Calls[]> {
        return await this.callsService.findUrgentUnassigned();
    }

    /**
     * GET /calls/filter/category-priority
     * Buscar chamados por categoria e prioridade
     */
    @Get('filter/category-priority')
    async findByCategoryAndPriority(
        @Query('category') category: 'technical' | 'payment' | 'account' | 'safety' | 'other',
        @Query('priority') priority: 'low' | 'medium' | 'high' | 'urgent'
    ): Promise<Calls[]> {
        return await this.callsService.findByCategoryAndPriority(category, priority);
    }

    /**
     * GET /calls/sla/violations
     * Buscar chamados que violaram SLA
     */
    @Get('sla/violations')
    async findSlaViolations(): Promise<Calls[]> {
        return await this.callsService.findSlaViolations();
    }

    // ==================== ATRIBUIR E RESPONDER ====================

    /**
     * PUT /calls/:id/assign
     * Atribuir chamado a um atendente
     */
    @Put(':id/assign')
    async assignToAgent(
        @Param('id', ParseIntPipe) id: number,
        @Body() assignAgentDto: AssignAgentDto
    ): Promise<Calls> {
        return await this.callsService.assignToAgent(
            id,
            assignAgentDto.agentId,
            assignAgentDto.agentName
        );
    }

    /**
     * POST /calls/:id/first-response
     * Adicionar primeira resposta
     */
    @Post(':id/first-response')
    async addFirstResponse(
        @Param('id', ParseIntPipe) id: number,
        @Body() addResponseDto: AddResponseDto
    ): Promise<Calls> {
        return await this.callsService.addFirstResponse(id, addResponseDto.response);
    }

    /**
     * PUT /calls/:id/response
     * Atualizar resposta do chamado
     */
    @Put(':id/response')
    async updateResponse(
        @Param('id', ParseIntPipe) id: number,
        @Body() addResponseDto: AddResponseDto
    ): Promise<Calls> {
        return await this.callsService.updateResponse(id, addResponseDto.response);
    }

    /**
     * PUT /calls/:id/waiting-user
     * Alterar status para aguardando usuário
     */
    @Put(':id/waiting-user')
    async setWaitingUser(@Param('id', ParseIntPipe) id: number): Promise<Calls> {
        return await this.callsService.setWaitingUser(id);
    }

    // ==================== RESOLVER E FECHAR ====================

    /**
     * PUT /calls/:id/resolve
     * Resolver chamado
     */
    @Put(':id/resolve')
    async resolve(
        @Param('id', ParseIntPipe) id: number,
        @Body() resolveCallDto: ResolveCallDto
    ): Promise<Calls> {
        return await this.callsService.resolve(id, resolveCallDto.resolution);
    }

    /**
     * PUT /calls/:id/close
     * Fechar chamado
     */
    @Put(':id/close')
    async close(@Param('id', ParseIntPipe) id: number): Promise<Calls> {
        return await this.callsService.close(id);
    }

    /**
     * POST /calls/:id/rating
     * Adicionar avaliação do usuário
     */
    @Post(':id/rating')
    async addRating(
        @Param('id', ParseIntPipe) id: number,
        @Body() addRatingDto: AddRatingDto
    ): Promise<Calls> {
        return await this.callsService.addRating(
            id,
            addRatingDto.rating,
            addRatingDto.feedback
        );
    }

    // ==================== NOTAS E TAGS ====================

    /**
     * POST /calls/:id/notes
     * Adicionar notas internas
     */
    @Post(':id/notes')
    async addInternalNotes(
        @Param('id', ParseIntPipe) id: number,
        @Body() addNotesDto: AddNotesDto
    ): Promise<Calls> {
        return await this.callsService.addInternalNotes(id, addNotesDto.notes);
    }

    /**
     * POST /calls/:id/tags
     * Adicionar tags ao chamado
     */
    @Post(':id/tags')
    async addTags(
        @Param('id', ParseIntPipe) id: number,
        @Body() addTagsDto: AddTagsDto
    ): Promise<Calls> {
        return await this.callsService.addTags(id, addTagsDto.tags);
    }

    // ==================== RELACIONAMENTOS ====================

    /**
     * PUT /calls/:id/relate
     * Relacionar com outro chamado
     */
    @Put(':id/relate')
    async relateToTicket(
        @Param('id', ParseIntPipe) id: number,
        @Body() relateTicketDto: RelateTicketDto
    ): Promise<Calls> {
        return await this.callsService.relateToTicket(id, relateTicketDto.relatedTicketId);
    }

    /**
     * PUT /calls/:id/escalate
     * Escalar chamado
     */
    @Put(':id/escalate')
    async escalate(@Param('id', ParseIntPipe) id: number): Promise<Calls> {
        return await this.callsService.escalate(id);
    }

    // ==================== CONTROLE ====================

    /**
     * PUT /calls/:id/view
     * Atualizar última visualização do usuário
     */
    @Put(':id/view')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateLastViewed(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.callsService.updateLastViewed(id);
    }

    /**
     * DELETE /calls/:id
     * Soft delete - marcar como deletado
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.callsService.softDelete(id);
    }

    /**
     * PUT /calls/:id/restore
     * Restaurar chamado deletado
     */
    @Put(':id/restore')
    async restore(@Param('id', ParseIntPipe) id: number): Promise<Calls> {
        return await this.callsService.restore(id);
    }

    // ==================== ESTATÍSTICAS ====================

    /**
     * GET /calls/:id/stats
     * Obter estatísticas de um chamado
     */
    @Get(':id/stats')
    async getCallStats(@Param('id', ParseIntPipe) id: number): Promise<{
        responseTime: number | null;
        resolutionTime: number | null;
        isOpen: boolean;
        isClosed: boolean;
        isWaitingUser: boolean;
    }> {
        return await this.callsService.getCallStats(id);
    }

    /**
     * GET /calls/stats/general
     * Obter estatísticas gerais
     */
    @Get('stats/general')
    async getGeneralStats(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
        avgResponseTime: number;
        avgResolutionTime: number;
    }> {
        return await this.callsService.getGeneralStats();
    }
}
