import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan, In } from 'typeorm';
import { Calls } from './calls.entity';

@Injectable()
export class CallsService {
    constructor(
        @InjectRepository(Calls)
        private readonly callsRepository: Repository<Calls>,
    ) {}

    /**
     * Gera um número único de ticket (ex: SUP-2024-00123)
     */
    private async generateTicketNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `SUP-${year}-`;

        // Buscar o último ticket do ano
        const lastTicket = await this.callsRepository
            .createQueryBuilder('call')
            .where('call.ticketNumber LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('call.id', 'DESC')
            .getOne();

        let nextNumber = 1;
        if (lastTicket) {
            const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    }

    /**
     * Criar novo chamado
     */
    async create(data: {
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
    }): Promise<Calls> {
        const ticketNumber = await this.generateTicketNumber();

        const call = this.callsRepository.create({
            ticketNumber,
            user: { id: data.userId },
            userEmail: data.userEmail,
            userPhone: data.userPhone,
            title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority || 'medium',
            deviceInfo: data.deviceInfo,
            appVersion: data.appVersion,
            attachments: data.attachments?.map(att => ({
                ...att,
                uploadedAt: new Date()
            })),
            status: 'open',
            escalationLevel: 1
        });

        return await this.callsRepository.save(call);
    }

    /**
     * Buscar chamado por ID
     */
    async findOne(id: number): Promise<Calls> {
        const call = await this.callsRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['user', 'assignedToUser', 'relatedTicket']
        });

        if (!call) {
            throw new NotFoundException(`Chamado #${id} não encontrado`);
        }

        return call;
    }

    /**
     * Buscar chamado por número do ticket
     */
    async findByTicketNumber(ticketNumber: string): Promise<Calls> {
        const call = await this.callsRepository.findOne({
            where: { ticketNumber, isDeleted: false },
            relations: ['user', 'assignedToUser', 'relatedTicket']
        });

        if (!call) {
            throw new NotFoundException(`Chamado ${ticketNumber} não encontrado`);
        }

        return call;
    }

    /**
     * Buscar todos os chamados de um usuário
     */
    async findByUser(
        userId: number,
        filters?: {
            status?: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
            category?: string;
            priority?: string;
        }
    ): Promise<Calls[]> {
        const where: any = {
            user: { id: userId },
            isDeleted: false
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.priority) {
            where.priority = filters.priority;
        }

        return await this.callsRepository.find({
            where,
            relations: ['assignedToUser'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Buscar chamados abertos de um usuário
     */
    async findOpenByUser(userId: number): Promise<Calls[]> {
        return await this.callsRepository.find({
            where: {
                user: { id: userId },
                status: In(['open', 'in_progress', 'waiting_user']),
                isDeleted: false
            },
            relations: ['assignedToUser'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Buscar chamados atribuídos a um atendente
     */
    async findByAgent(agentId: number): Promise<Calls[]> {
        return await this.callsRepository.find({
            where: {
                assignedToUser: { id: agentId },
                status: Not(In(['resolved', 'closed'])),
                isDeleted: false
            },
            relations: ['user'],
            order: { priority: 'DESC', createdAt: 'ASC' }
        });
    }

    /**
     * Buscar chamados urgentes não atribuídos
     */
    async findUrgentUnassigned(): Promise<Calls[]> {
        return await this.callsRepository.find({
            where: {
                priority: 'urgent',
                assignedToUser: IsNull(),
                status: 'open',
                isDeleted: false
            },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });
    }

    /**
     * Buscar chamados por categoria e prioridade
     */
    async findByCategoryAndPriority(
        category: 'technical' | 'payment' | 'account' | 'safety' | 'other',
        priority: 'low' | 'medium' | 'high' | 'urgent'
    ): Promise<Calls[]> {
        return await this.callsRepository.find({
            where: {
                category,
                priority,
                isDeleted: false
            },
            relations: ['user', 'assignedToUser'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Buscar chamados que violaram SLA (sem resposta em 1 hora)
     */
    async findSlaViolations(): Promise<Calls[]> {
        const oneHourAgo = new Date(Date.now() - 3600000);

        return await this.callsRepository.find({
            where: {
                createdAt: LessThan(oneHourAgo),
                firstResponseAt: IsNull(),
                status: Not('closed'),
                isDeleted: false
            },
            relations: ['user', 'assignedToUser'],
            order: { createdAt: 'ASC' }
        });
    }

    /**
     * Atribuir chamado a um atendente
     */
    async assignToAgent(
        callId: number,
        agentId: number,
        agentName: string
    ): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.isClosed()) {
            throw new BadRequestException('Não é possível atribuir um chamado já fechado');
        }

        call.assignedToUser = { id: agentId } as any;
        call.assignedToUserName = agentName;
        call.status = 'in_progress';

        return await this.callsRepository.save(call);
    }

    /**
     * Adicionar primeira resposta
     */
    async addFirstResponse(
        callId: number,
        response: string
    ): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.firstResponseAt) {
            throw new BadRequestException('Este chamado já possui uma primeira resposta');
        }

        call.response = response;
        call.firstResponseAt = new Date();

        return await this.callsRepository.save(call);
    }

    /**
     * Atualizar resposta do chamado
     */
    async updateResponse(
        callId: number,
        response: string
    ): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.isClosed()) {
            throw new BadRequestException('Não é possível atualizar um chamado já fechado');
        }

        call.response = response;

        if (!call.firstResponseAt) {
            call.firstResponseAt = new Date();
        }

        return await this.callsRepository.save(call);
    }

    /**
     * Alterar status para aguardando usuário
     */
    async setWaitingUser(callId: number): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.isClosed()) {
            throw new BadRequestException('Não é possível alterar status de chamado fechado');
        }

        call.status = 'waiting_user';

        return await this.callsRepository.save(call);
    }

    /**
     * Resolver chamado
     */
    async resolve(
        callId: number,
        resolution: string
    ): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.status === 'closed') {
            throw new BadRequestException('Chamado já está fechado');
        }

        call.status = 'resolved';
        call.resolution = resolution;
        call.resolvedAt = new Date();

        return await this.callsRepository.save(call);
    }

    /**
     * Fechar chamado
     */
    async close(callId: number): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.status === 'closed') {
            throw new BadRequestException('Chamado já está fechado');
        }

        call.status = 'closed';
        call.closedAt = new Date();

        if (!call.resolvedAt) {
            call.resolvedAt = new Date();
        }

        return await this.callsRepository.save(call);
    }

    /**
     * Adicionar avaliação do usuário
     */
    async addRating(
        callId: number,
        rating: number,
        feedback?: string
    ): Promise<Calls> {
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Avaliação deve ser entre 1 e 5 estrelas');
        }

        const call = await this.findOne(callId);

        if (!call.isClosed()) {
            throw new BadRequestException('Só é possível avaliar chamados resolvidos ou fechados');
        }

        call.rating = rating;
        call.feedback = feedback;

        return await this.callsRepository.save(call);
    }

    /**
     * Adicionar notas internas
     */
    async addInternalNotes(
        callId: number,
        notes: string
    ): Promise<Calls> {
        const call = await this.findOne(callId);

        const existingNotes = call.internalNotes || '';
        const timestamp = new Date().toLocaleString('pt-BR');
        call.internalNotes = `${existingNotes}\n[${timestamp}] ${notes}`.trim();

        return await this.callsRepository.save(call);
    }

    /**
     * Adicionar tags ao chamado
     */
    async addTags(callId: number, tags: string[]): Promise<Calls> {
        const call = await this.findOne(callId);

        const existingTags = call.tags || [];
        call.tags = [...new Set([...existingTags, ...tags])]; // Remove duplicatas

        return await this.callsRepository.save(call);
    }

    /**
     * Relacionar com outro chamado
     */
    async relateToTicket(
        callId: number,
        relatedTicketId: number
    ): Promise<Calls> {
        const call = await this.findOne(callId);
        const relatedCall = await this.findOne(relatedTicketId);

        call.relatedTicket = relatedCall;

        return await this.callsRepository.save(call);
    }

    /**
     * Escalar chamado
     */
    async escalate(callId: number): Promise<Calls> {
        const call = await this.findOne(callId);

        if (call.escalationLevel >= 3) {
            throw new BadRequestException('Chamado já está no nível máximo de escalação');
        }

        call.escalationLevel += 1;

        return await this.callsRepository.save(call);
    }

    /**
     * Atualizar última visualização do usuário
     */
    async updateLastViewed(callId: number): Promise<void> {
        await this.callsRepository.update(callId, {
            lastViewedByUserAt: new Date()
        });
    }

    /**
     * Soft delete - marcar como deletado
     */
    async softDelete(callId: number): Promise<void> {
        const call = await this.findOne(callId);
        call.isDeleted = true;
        await this.callsRepository.save(call);
    }

    /**
     * Restaurar chamado deletado
     */
    async restore(callId: number): Promise<Calls> {
        const call = await this.callsRepository.findOne({
            where: { id: callId },
            relations: ['user', 'assignedToUser']
        });

        if (!call) {
            throw new NotFoundException(`Chamado #${callId} não encontrado`);
        }

        call.isDeleted = false;
        return await this.callsRepository.save(call);
    }

    /**
     * Obter estatísticas de um chamado
     */
    async getCallStats(callId: number): Promise<{
        responseTime: number | null;
        resolutionTime: number | null;
        isOpen: boolean;
        isClosed: boolean;
        isWaitingUser: boolean;
    }> {
        const call = await this.findOne(callId);

        return {
            responseTime: call.getResponseTime(),
            resolutionTime: call.getResolutionTime(),
            isOpen: call.isOpen(),
            isClosed: call.isClosed(),
            isWaitingUser: call.isWaitingUser()
        };
    }

    /**
     * Obter estatísticas gerais
     */
    async getGeneralStats(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
        avgResponseTime: number;
        avgResolutionTime: number;
    }> {
        const [total, open, inProgress, resolved, closed] = await Promise.all([
            this.callsRepository.count({ where: { isDeleted: false } }),
            this.callsRepository.count({ where: { status: 'open', isDeleted: false } }),
            this.callsRepository.count({ where: { status: 'in_progress', isDeleted: false } }),
            this.callsRepository.count({ where: { status: 'resolved', isDeleted: false } }),
            this.callsRepository.count({ where: { status: 'closed', isDeleted: false } })
        ]);

        // Calcular médias de tempo
        const callsWithResponse = await this.callsRepository.find({
            where: { firstResponseAt: Not(IsNull()), isDeleted: false },
            select: ['createdAt', 'firstResponseAt']
        });

        const callsWithResolution = await this.callsRepository.find({
            where: { resolvedAt: Not(IsNull()), isDeleted: false },
            select: ['createdAt', 'resolvedAt']
        });

        const avgResponseTime = callsWithResponse.length > 0
            ? callsWithResponse.reduce((sum, call) => {
                const diff = call.firstResponseAt!.getTime() - call.createdAt.getTime();
                return sum + Math.floor(diff / 1000 / 60);
            }, 0) / callsWithResponse.length
            : 0;

        const avgResolutionTime = callsWithResolution.length > 0
            ? callsWithResolution.reduce((sum, call) => {
                const diff = call.resolvedAt!.getTime() - call.createdAt.getTime();
                return sum + Math.floor(diff / 1000 / 60 / 60);
            }, 0) / callsWithResolution.length
            : 0;

        return {
            total,
            open,
            inProgress,
            resolved,
            closed,
            avgResponseTime: Math.round(avgResponseTime),
            avgResolutionTime: Math.round(avgResolutionTime)
        };
    }
}
