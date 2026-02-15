import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToMany, JoinTable, OneToMany, OneToOne } from 'typeorm';
import { hash } from 'bcrypt';
import { Rol } from 'src/roles/rol.entity';
import { DriversPosition } from 'src/drivers_position/drivers_position.entity';
import { ClientRequests } from 'src/client_requests/client_requests.entity';
import { DriverTripOffers } from 'src/driver_trip_offers/driver_trip_offers.entity';
import { DriverCarInfo } from 'src/driver_car_info/driver_car_info.entity';
import { Balance } from 'src/balance/balance.entity';


@Entity({ name: 'users' })
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    lastname: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    phone: string;

    @Column({ nullable: true })
    image: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    notification_token: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
    
    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @JoinTable({
        name: 'user_has_roles',
        joinColumn: {
            name: 'id_user'
        },
        inverseJoinColumn: {
            name: 'id_rol'
        }
    })
    @ManyToMany(() => Rol, (rol) => rol.users)
    roles: Rol[];

    @OneToMany(() => DriversPosition, driversPosition => driversPosition.id_driver)
    driversPosition: DriversPosition;

    @OneToMany(() => ClientRequests, clientRequests => clientRequests.id_client)
    clientRequests: ClientRequests;

    @OneToMany(() => ClientRequests, clientRequests => clientRequests.id_driver_assigned)
    clientRequestsDriverAssigned: ClientRequests;

    @OneToMany(() => DriverTripOffers, driverTripOffers => driverTripOffers.id_driver)
    driverTripOffers: DriverTripOffers;

    @OneToMany(() => DriverCarInfo, driverCarInfo => driverCarInfo.id_driver)
    driverCarInfo: DriverCarInfo;

    @OneToOne(() => Balance, balance => balance.user)
    balance: Balance;

    @Column({ type: 'boolean', nullable: true, default: null })
    car: boolean;

    @Column({ unique: true, nullable: true, length: 11 })
    cpf: string;

    @Column({ type: 'boolean', default: false })
    phone_verified: boolean;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @BeforeInsert()
    async hashPassword() {
        this.password = await hash(this.password, Number(process.env.HASH_SALT));
    }

    @Column('decimal', { nullable: true, precision: 5, scale: 2 })
    general_client_rating: number;

    @Column('decimal', { nullable: true, precision: 5, scale: 2 })
    general_driver_rating: number;
}