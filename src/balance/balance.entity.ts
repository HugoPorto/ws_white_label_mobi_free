import { User } from "src/users/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'balance' })
export class Balance {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    balance_in: number;

    @Column({ nullable: false })
    balance_out: number;

    @OneToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'id_user' })
    user: User;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}