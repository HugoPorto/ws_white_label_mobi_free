import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MessageRead } from "./message-reads.entity";

@Entity({ name: 'messages' })
@Index('idx_messages_target_user', ['targetUser'])
@Index('idx_messages_target_type_active', ['targetType', 'isActive'])
@Index('idx_messages_category_priority', ['category', 'priority'])
@Index('idx_messages_published_expires', ['publishedAt', 'expiresAt'])
@Index('idx_messages_created_by_admin', ['createdByAdmin'])
@Index('idx_messages_scheduled_for', ['scheduledFor'])
export class Messages {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: false })
    messageCode: string;

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'id_admin_user' })
    createdByAdmin: User;

    @Column({ type: 'text', nullable: false })
    createdByAdminName: string;

    @Column({
        type: 'enum',
        enum: ['admin', 'system', 'moderator'],
        default: 'system'
    })
    senderRole: 'admin' | 'system' | 'moderator';

    @Column({
        type: 'enum',
        enum: ['all_users', 'specific_user', 'user_group', 'role_based'],
        default: 'all_users'
    })
    targetType: 'all_users' | 'specific_user' | 'user_group' | 'role_based';

    @OneToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'target_user_id' })
    targetUser?: User;

    @Column({ type: 'simple-json', nullable: true })
    targetUserIds?: number[]; // populated when targetType === 'user_group'

    @Column({
        type: 'enum',
        enum: ['driver', 'passenger', 'both'],
        nullable: true
    })
    targetRole?: 'driver' | 'passenger' | 'both';

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    message: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    shortPreview: string;

    /** Utility: populate shortPreview with the first 100 chars of message */
    setShortPreviewFromMessage(): void {
        this.shortPreview = this.message ? this.message.slice(0, 100) : '';
    }

    @Column({
        type: 'enum',
        enum: ['info', 'warning', 'alert', 'update', 'maintenance', 'promotion'],
        default: 'info'
    })
    category: 'info' | 'warning' | 'alert' | 'update' | 'maintenance' | 'promotion';

    @Column({
        type: 'enum',
        enum: ['low', 'medium', 'high'],
        default: 'low'
    })
    priority: 'low' | 'medium' | 'high';

    /**
     * Pode ser dispensada pelo usuário
     */
    @Column({ type: 'boolean', default: true })
    isDismissible: boolean;

    /**
     * Requer confirmação de leitura
     */
    @Column({ type: 'boolean', default: false })
    requiresAcknowledgment: boolean;

    /**
     * Data/hora de expiração (opcional)
     */
    @Column({ type: 'timestamp', nullable: true })
    expiresAt?: Date;

    /**
     * Mensagem ativa/visível
     */
    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    /**
     * Configuração de botão de ação (ex: { text: 'Ver mais', link: 'https://...', action: 'open_modal' })
     */
    @Column({ type: 'simple-json', nullable: true })
    actionButton?: { text: string; link?: string; action?: string };

    /**
     * Data/hora agendada para envio
     */
    @Column({ type: 'timestamp', nullable: true })
    scheduledFor?: Date;

    /**
     * Enviar imediatamente
     */
    @Column({ type: 'boolean', default: false })
    sendImmediately: boolean;

    /**
     * Tipo de repetição (none, daily, weekly, monthly)
     */
    @Column({
        type: 'enum',
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
    })
    repeatType: 'none' | 'daily' | 'weekly' | 'monthly';

    /**
     * Repetir até quando (opcional)
     */
    @Column({ type: 'timestamp', nullable: true })
    repeatUntil?: Date;

    /**
     * Data/hora de criação
     */
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    /**
     * Data/hora da última atualização
     */
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    /**
     * Data/hora de publicação/envio (opcional)
     */
    @Column({ type: 'timestamp', nullable: true })
    publishedAt?: Date;

    /**
     * Soft delete (populado pelo DeleteDateColumn ao realizar softRemove)
     */
    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt?: Date;

    @Column({ type: 'int', default: 0 })
    totalRecipients: number;

    @Column({ type: 'int', default: 0 })
    totalViews: number;

    @Column({ type: 'int', default: 0 })
    totalReads: number;

    @Column({ type: 'int', default: 0 })
    totalAcknowledgments: number;

    @Column({ type: 'simple-json', nullable: true })
    attachments?: { url: string; type?: 'image' | 'pdf' | 'other'; name?: string }[];

    @Column({ type: 'varchar', length: 100, nullable: true })
    icon?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    iconColor?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    imageUrl?: string;

    @Column({ type: 'simple-json', nullable: true })
    tags?: string[];

    @OneToMany(() => MessageRead, (read) => read.message)
    reads: MessageRead[];
}