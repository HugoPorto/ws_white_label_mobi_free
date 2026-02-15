import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'calls' })
@Index('idx_calls_user', ['user'])
@Index('idx_calls_status', ['status'])
@Index('idx_calls_created_at', ['createdAt'])
@Index('idx_calls_ticket_number', ['ticketNumber'], { unique: true })
@Index('idx_calls_category_priority', ['category', 'priority'])
@Index('idx_calls_assigned_to', ['assignedToUser'])
export class Calls {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
    ticketNumber: string;

    // ==================== USUÁRIO ====================
    
    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 255, nullable: false })
    userEmail: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    userPhone?: string;

    // ==================== CONTEÚDO DO CHAMADO ====================

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({
        type: 'enum',
        enum: ['technical', 'payment', 'account', 'safety', 'other'],
        nullable: false
    })
    category: 'technical' | 'payment' | 'account' | 'safety' | 'other';

    @Column({
        type: 'enum',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    })
    priority: 'low' | 'medium' | 'high' | 'urgent';

    // ==================== STATUS E ATENDIMENTO ====================

    @Column({
        type: 'enum',
        enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'],
        default: 'open'
    })
    status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

    @ManyToOne(() => User, (user) => user.id, { nullable: true })
    @JoinColumn({ name: 'assigned_to_user_id' })
    assignedToUser?: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    assignedToUserName?: string;

    // ==================== RESPOSTA E SOLUÇÃO ====================

    @Column({ type: 'text', nullable: true })
    response?: string;

    @Column({ type: 'text', nullable: true })
    resolution?: string;

    @Column({ type: 'text', nullable: true })
    internalNotes?: string;

    // ==================== DATAS ====================

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    firstResponseAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    resolvedAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    closedAt?: Date;

    // ==================== AVALIAÇÃO ====================

    @Column({ type: 'int', nullable: true })
    rating?: number; // 1-5 estrelas

    @Column({ type: 'text', nullable: true })
    feedback?: string;

    // ==================== ANEXOS E METADADOS ====================

    @Column({ type: 'simple-json', nullable: true })
    attachments?: {
        url: string;
        type?: 'image' | 'pdf' | 'document' | 'other';
        name?: string;
        size?: number;
        uploadedAt?: Date;
    }[];

    @Column({ type: 'simple-json', nullable: true })
    deviceInfo?: {
        platform?: string;      // 'ios' | 'android' | 'web'
        osVersion?: string;     // '17.0', '14.0'
        deviceModel?: string;   // 'iPhone 15 Pro', 'Samsung Galaxy S23'
        deviceId?: string;
    };

    @Column({ type: 'varchar', length: 20, nullable: true })
    appVersion?: string;

    @Column({ type: 'timestamp', nullable: true })
    lastViewedByUserAt?: Date;

    // ==================== CAMPOS DE CONTROLE ====================

    @Column({ type: 'boolean', default: false })
    isDeleted: boolean;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt?: Date;

    @Column({ type: 'simple-json', nullable: true })
    tags?: string[];

    @ManyToOne(() => Calls, { nullable: true })
    @JoinColumn({ name: 'related_ticket_id' })
    relatedTicket?: Calls;

    @Column({ type: 'int', default: 1 })
    escalationLevel: number; // 1, 2, 3

    // ==================== MÉTODOS UTILITÁRIOS ====================

    /**
     * Verifica se o chamado está aguardando resposta do usuário
     */
    isWaitingUser(): boolean {
        return this.status === 'waiting_user';
    }

    /**
     * Verifica se o chamado está aberto (open ou in_progress)
     */
    isOpen(): boolean {
        return this.status === 'open' || this.status === 'in_progress' || this.status === 'waiting_user';
    }

    /**
     * Verifica se o chamado foi resolvido ou fechado
     */
    isClosed(): boolean {
        return this.status === 'resolved' || this.status === 'closed';
    }

    /**
     * Calcula o tempo de resposta (em minutos)
     */
    getResponseTime(): number | null {
        if (!this.firstResponseAt) return null;
        const diff = this.firstResponseAt.getTime() - this.createdAt.getTime();
        return Math.floor(diff / 1000 / 60); // minutos
    }

    /**
     * Calcula o tempo de resolução (em horas)
     */
    getResolutionTime(): number | null {
        if (!this.resolvedAt) return null;
        const diff = this.resolvedAt.getTime() - this.createdAt.getTime();
        return Math.floor(diff / 1000 / 60 / 60); // horas
    }
}
