import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan, IsNull, Not, Brackets } from 'typeorm';
import { Messages } from './messages.entity';
import { MessageRead } from './message-reads.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Messages)
        private readonly messagesRepository: Repository<Messages>,
        @InjectRepository(MessageRead)
        private readonly messageReadRepository: Repository<MessageRead>,
    ) { }

    /**
     * Gera um código único para a mensagem (ex: MSG-2025-00123)
     */
    private async generateMessageCode(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `MSG-${year}-`;

        const lastMessage = await this.messagesRepository
            .createQueryBuilder('message')
            .where('message.messageCode LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('message.id', 'DESC')
            .getOne();

        let nextNumber = 1;
        if (lastMessage) {
            const lastNumber = parseInt(lastMessage.messageCode.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    }

    /**
     * Cria uma nova mensagem
     */
    async create(data: Partial<Messages>): Promise<Messages> {
        const messageCode = await this.generateMessageCode();

        const message = this.messagesRepository.create({
            ...data,
            messageCode,
            publishedAt: data.sendImmediately ? new Date() : data.scheduledFor,
        });

        // Gera preview automático se não fornecido
        if (!message.shortPreview && message.message) {
            message.setShortPreviewFromMessage();
        }

        const saved = await this.messagesRepository.save(message);

        // Se é para enviar imediatamente e tem destinatários, atualizar contadores
        if (data.sendImmediately) {
            await this.updateRecipientCount(saved.id);
        }

        return saved;
    }

    /**
     * Busca uma mensagem por ID
     */
    async findOne(id: number): Promise<Messages> {
        const message = await this.messagesRepository.findOne({
            where: { id },
            relations: ['createdByAdmin', 'targetUser', 'reads'],
        });

        if (!message) {
            throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
        }

        return message;
    }

    /**
     * Busca mensagem por código
     */
    async findByCode(messageCode: string): Promise<Messages> {
        const message = await this.messagesRepository.findOne({
            where: { messageCode },
            relations: ['createdByAdmin', 'targetUser', 'reads'],
        });

        if (!message) {
            throw new NotFoundException(`Mensagem ${messageCode} não encontrada`);
        }

        return message;
    }

    /**
     * Busca mensagens ativas para um usuário específico
     */
    async findActiveForUser(userId: number, options?: {
        category?: string;
        priority?: string;
        unreadOnly?: boolean;
    }): Promise<Messages[]> {
        const query = this.messagesRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.reads', 'read', 'read.user.id = :userId', { userId })
            .where('message.isActive = :isActive', { isActive: true })
            .andWhere('(message.expiresAt IS NULL OR message.expiresAt > :now)', { now: new Date() })
            .andWhere(
                new Brackets(qb => {
                    qb.where('message.targetType = :all', { all: 'all_users' })
                        .orWhere('(message.targetType = :specific AND message.targetUser.id = :userId)',
                            { specific: 'specific_user', userId })
                        .orWhere('(message.targetType = :group AND JSON_CONTAINS(message.targetUserIds, :userIdJson))',
                            { group: 'user_group', userIdJson: JSON.stringify(userId) });
                })
            );

        if (options?.category) {
            query.andWhere('message.category = :category', { category: options.category });
        }

        if (options?.priority) {
            query.andWhere('message.priority = :priority', { priority: options.priority });
        }

        if (options?.unreadOnly) {
            query.andWhere('(read.isRead IS NULL OR read.isRead = false)');
        }

        return query
            .orderBy('message.priority', 'DESC')
            .addOrderBy('message.publishedAt', 'DESC')
            .getMany();
    }

    /**
     * Busca mensagens por tipo de destinatário
     */
    async findByTargetType(targetType: 'all_users' | 'specific_user' | 'user_group' | 'role_based'): Promise<Messages[]> {
        return this.messagesRepository.find({
            where: { targetType },
            relations: ['createdByAdmin', 'targetUser'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Busca mensagens por categoria e prioridade
     */
    async findByCategoryAndPriority(
        category: string,
        priority: string
    ): Promise<Messages[]> {
        return this.messagesRepository.find({
            where: { category: category as any, priority: priority as any },
            relations: ['createdByAdmin'],
            order: { publishedAt: 'DESC' },
        });
    }

    /**
     * Busca mensagens agendadas pendentes
     */
    async findScheduledPending(): Promise<Messages[]> {
        return this.messagesRepository.find({
            where: {
                sendImmediately: false,
                isActive: true,
                publishedAt: IsNull(),
                scheduledFor: LessThan(new Date()),
            },
            relations: ['createdByAdmin'],
        });
    }

    /**
     * Busca mensagens expiradas que ainda estão ativas
     */
    async findExpiredActive(): Promise<Messages[]> {
        return this.messagesRepository.find({
            where: {
                isActive: true,
                expiresAt: LessThan(new Date()),
            },
        });
    }

    /**
     * Busca mensagens que requerem confirmação
     */
    async findRequiringAcknowledgment(userId: number): Promise<Messages[]> {
        return this.messagesRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.reads', 'read', 'read.user.id = :userId', { userId })
            .where('message.requiresAcknowledgment = :required', { required: true })
            .andWhere('message.isActive = :isActive', { isActive: true })
            .andWhere('(read.acknowledgedAt IS NULL)')
            .andWhere(
                new Brackets(qb => {
                    qb.where('message.targetType = :all', { all: 'all_users' })
                        .orWhere('(message.targetType = :specific AND message.targetUser.id = :userId)',
                            { specific: 'specific_user', userId })
                        .orWhere('(message.targetType = :group AND JSON_CONTAINS(message.targetUserIds, :userIdJson))',
                            { group: 'user_group', userIdJson: JSON.stringify(userId) });
                })
            )
            .getMany();
    }

    /**
     * Atualiza uma mensagem
     */
    async update(id: number, data: Partial<Messages>): Promise<Messages> {
        const message = await this.findOne(id);

        Object.assign(message, data);

        if (data.message && !data.shortPreview) {
            message.setShortPreviewFromMessage();
        }

        return this.messagesRepository.save(message);
    }

    /**
     * Ativa uma mensagem
     */
    async activate(id: number): Promise<Messages> {
        const message = await this.findOne(id);
        message.isActive = true;

        if (!message.publishedAt) {
            message.publishedAt = new Date();
            await this.updateRecipientCount(id);
        }

        return this.messagesRepository.save(message);
    }

    /**
     * Desativa uma mensagem
     */
    async deactivate(id: number): Promise<Messages> {
        const message = await this.findOne(id);
        message.isActive = false;
        return this.messagesRepository.save(message);
    }

    /**
     * Publica uma mensagem agendada
     */
    async publish(id: number): Promise<Messages> {
        const message = await this.findOne(id);

        if (message.publishedAt) {
            throw new BadRequestException('Mensagem já foi publicada');
        }

        message.publishedAt = new Date();
        message.isActive = true;

        const saved = await this.messagesRepository.save(message);
        await this.updateRecipientCount(id);

        return saved;
    }

    /**
     * Marca uma mensagem como lida por um usuário
     */
    async markAsRead(messageId: number, userId: number, deviceInfo?: any): Promise<MessageRead> {
        const message = await this.findOne(messageId);

        let messageRead = await this.messageReadRepository.findOne({
            where: { message: { id: messageId }, user: { id: userId } },
        });

        if (!messageRead) {
            messageRead = this.messageReadRepository.create({
                message: { id: messageId } as any,
                user: { id: userId } as any,
                isRead: true,
                readAt: new Date(),
                deviceInfo,
            });
        } else {
            messageRead.isRead = true;
            messageRead.readAt = new Date();
            if (deviceInfo) {
                messageRead.deviceInfo = deviceInfo;
            }
        }

        const saved = await this.messageReadRepository.save(messageRead);

        // Atualiza contador de leituras
        await this.updateReadCount(messageId);

        return saved;
    }

    /**
     * Marca uma mensagem como confirmada/reconhecida por um usuário
     */
    async acknowledge(messageId: number, userId: number): Promise<MessageRead> {
        const message = await this.findOne(messageId);

        if (!message.requiresAcknowledgment) {
            throw new BadRequestException('Mensagem não requer confirmação');
        }

        let messageRead = await this.messageReadRepository.findOne({
            where: { message: { id: messageId }, user: { id: userId } },
        });

        if (!messageRead) {
            messageRead = this.messageReadRepository.create({
                message: { id: messageId } as any,
                user: { id: userId } as any,
                isRead: true,
                readAt: new Date(),
                acknowledgedAt: new Date(),
            });
        } else {
            messageRead.acknowledgedAt = new Date();
        }

        const saved = await this.messageReadRepository.save(messageRead);

        // Atualiza contador de confirmações
        await this.updateAcknowledgmentCount(messageId);

        return saved;
    }

    /**
     * Busca status de leitura de uma mensagem para um usuário
     */
    async getReadStatus(messageId: number, userId: number): Promise<MessageRead | null> {
        return this.messageReadRepository.findOne({
            where: { message: { id: messageId }, user: { id: userId } },
            relations: ['message', 'user'],
        });
    }

    /**
     * Adiciona tags a uma mensagem
     */
    async addTags(id: number, tags: string[]): Promise<Messages> {
        const message = await this.findOne(id);

        const currentTags = message.tags || [];
        message.tags = [...new Set([...currentTags, ...tags])];

        return this.messagesRepository.save(message);
    }

    /**
     * Remove tags de uma mensagem
     */
    async removeTags(id: number, tags: string[]): Promise<Messages> {
        const message = await this.findOne(id);

        if (message.tags) {
            message.tags = message.tags.filter(tag => !tags.includes(tag));
        }

        return this.messagesRepository.save(message);
    }

    /**
     * Atualiza o contador de destinatários
     */
    async updateRecipientCount(id: number): Promise<void> {
        const message = await this.findOne(id);

        let count = 0;

        if (message.targetType === 'all_users') {
            // Buscar total de usuários ativos no sistema
            // count = await this.usersRepository.count({ where: { isActive: true } });
            count = 0; // Implementar quando tiver acesso ao UsersRepository
        } else if (message.targetType === 'specific_user') {
            count = 1;
        } else if (message.targetType === 'user_group' && message.targetUserIds) {
            count = message.targetUserIds.length;
        } else if (message.targetType === 'role_based') {
            // Buscar total de usuários por role
            count = 0; // Implementar quando tiver acesso ao UsersRepository
        }

        await this.messagesRepository.update(id, { totalRecipients: count });
    }

    /**
     * Atualiza o contador de visualizações
     */
    async incrementViewCount(id: number): Promise<void> {
        await this.messagesRepository.increment({ id }, 'totalViews', 1);
    }

    /**
     * Atualiza o contador de leituras
     */
    async updateReadCount(id: number): Promise<void> {
        const count = await this.messageReadRepository.count({
            where: { message: { id }, isRead: true },
        });

        await this.messagesRepository.update(id, { totalReads: count });
    }

    /**
     * Atualiza o contador de confirmações
     */
    async updateAcknowledgmentCount(id: number): Promise<void> {
        const count = await this.messageReadRepository.count({
            where: {
                message: { id },
                acknowledgedAt: Not(IsNull()),
            },
        });

        await this.messagesRepository.update(id, { totalAcknowledgments: count });
    }

    /**
     * Soft delete de uma mensagem
     */
    async softDelete(id: number): Promise<void> {
        const message = await this.findOne(id);
        await this.messagesRepository.softRemove(message);
    }

    /**
     * Restaura uma mensagem deletada
     */
    async restore(id: number): Promise<Messages> {
        const message = await this.messagesRepository.findOne({
            where: { id },
            withDeleted: true,
        });

        if (!message) {
            throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
        }

        message.deletedAt = null;
        return this.messagesRepository.save(message);
    }

    /**
     * Busca estatísticas de uma mensagem
     */
    async getMessageStats(id: number): Promise<{
        message: Messages;
        recipientCount: number;
        viewCount: number;
        readCount: number;
        acknowledgmentCount: number;
        readPercentage: number;
        acknowledgmentPercentage: number;
    }> {
        const message = await this.findOne(id);

        const readPercentage = message.totalRecipients > 0
            ? (message.totalReads / message.totalRecipients) * 100
            : 0;

        const acknowledgmentPercentage = message.totalRecipients > 0
            ? (message.totalAcknowledgments / message.totalRecipients) * 100
            : 0;

        return {
            message,
            recipientCount: message.totalRecipients,
            viewCount: message.totalViews,
            readCount: message.totalReads,
            acknowledgmentCount: message.totalAcknowledgments,
            readPercentage: Math.round(readPercentage * 100) / 100,
            acknowledgmentPercentage: Math.round(acknowledgmentPercentage * 100) / 100,
        };
    }

    /**
     * Busca estatísticas gerais de mensagens
     */
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
        const [
            totalMessages,
            activeMessages,
            scheduledMessages,
            expiredMessages,
        ] = await Promise.all([
            this.messagesRepository.count(),
            this.messagesRepository.count({ where: { isActive: true } }),
            this.messagesRepository.count({
                where: { sendImmediately: false, publishedAt: IsNull() }
            }),
            this.messagesRepository.count({
                where: { isActive: true, expiresAt: LessThan(new Date()) }
            }),
        ]);

        const allMessages = await this.messagesRepository.find({
            select: ['id', 'category', 'priority', 'totalRecipients', 'totalReads', 'totalAcknowledgments'],
        });

        let totalReads = 0;
        let totalAcknowledgments = 0;
        let totalRecipients = 0;

        const byCategory: Record<string, number> = {};
        const byPriority: Record<string, number> = {};

        allMessages.forEach(msg => {
            totalReads += msg.totalReads;
            totalAcknowledgments += msg.totalAcknowledgments;
            totalRecipients += msg.totalRecipients;

            byCategory[msg.category] = (byCategory[msg.category] || 0) + 1;
            byPriority[msg.priority] = (byPriority[msg.priority] || 0) + 1;
        });

        const averageReadRate = totalRecipients > 0
            ? (totalReads / totalRecipients) * 100
            : 0;

        return {
            totalMessages,
            activeMessages,
            scheduledMessages,
            expiredMessages,
            totalReads,
            totalAcknowledgments,
            averageReadRate: Math.round(averageReadRate * 100) / 100,
            byCategory,
            byPriority,
        };
    }
}
