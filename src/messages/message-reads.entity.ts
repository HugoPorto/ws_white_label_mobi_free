import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Messages } from "./messages.entity";

@Entity({ name: 'message_reads' })
@Index('idx_message_reads_unique', ['message', 'user'], { unique: true })
@Index('idx_message_reads_user_read', ['user', 'isRead'])
@Index('idx_message_reads_message', ['message'])
export class MessageRead {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Messages, (message) => message.reads, { nullable: false })
    @JoinColumn({ name: 'message_id' })
    message: Messages;

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @Column({ type: 'timestamp', nullable: true })
    readAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    acknowledgedAt?: Date;

    @Column({ type: 'simple-json', nullable: true })
    deviceInfo?: {
        platform?: string;      // 'ios' | 'android'
        osVersion?: string;     // '17.0', '14.0'
        appVersion?: string;    // '1.2.3'
        deviceModel?: string;   // 'iPhone 15 Pro', 'Samsung Galaxy S23'
        deviceId?: string;      // Device unique identifier
    };

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}
