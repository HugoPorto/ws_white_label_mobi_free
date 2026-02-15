import { User } from "src/users/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'vehicles' })
export class Veh {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    typeVehicle: string;

    @Column({ nullable: false, unique: true })
    licensePlate: string;

    @Column({ nullable: false })
    year: string;

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'id_user' })
    user: User;

    @Column({ nullable: true })
    brand: string;

    @Column({ nullable: true })
    model: string;

    @Column({ nullable: true })
    color: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isMain: boolean;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}