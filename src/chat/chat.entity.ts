import { User } from "src/users/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'chat' })
export class Chat {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: false })
    text: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    timestamp: Date;

    @Column({ type: 'boolean', default: false })
    isMe: boolean;

    @Column({ 
        type: 'enum', 
        enum: ['read', 'unread'], 
        default: 'unread' 
    })
    status: 'read' | 'unread';

    @Column({ 
        type: 'enum', 
        enum: ['text', 'image', 'video'], 
        default: 'text' 
    })
    type: 'text' | 'image' | 'video';

    @Column({ type: 'int', nullable: false })
    id_sender: number;

    @Column({ type: 'int', nullable: false })
    id_receiver: number;

    @Column({ type: 'int', nullable: true })
    id_client_request: number;

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'id_user' })
    user: User;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column({ type: 'boolean', default: false, nullable: true })
    is_driver: boolean;
}