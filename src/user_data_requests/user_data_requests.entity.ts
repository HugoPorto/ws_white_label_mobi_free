import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { hash } from 'bcrypt';
import { Rol } from 'src/roles/rol.entity';
import { DriversPosition } from 'src/drivers_position/drivers_position.entity';
import { ClientRequests } from 'src/client_requests/client_requests.entity';
import { DriverTripOffers } from 'src/driver_trip_offers/driver_trip_offers.entity';
import { DriverCarInfo } from 'src/driver_car_info/driver_car_info.entity';
import { User } from 'src/users/user.entity';


@Entity({ name: 'user_data_requests' })
export class UserDataRequests {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'id_user' })
    user: User;

    @Column({ type: 'boolean', default: false })
    status: boolean;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column({
        type: 'enum',
        enum: ['exclusion', 'information'],
        default: 'information'
    })
    type: 'exclusion' | 'information';
}