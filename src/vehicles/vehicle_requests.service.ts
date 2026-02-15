
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veh } from './veh.entity';

@Injectable()
export class VehicleRequestsService {

    constructor(
        @InjectRepository(Veh) private vehicleRequestsRepository: Repository<Veh>
    ) {
    }

    async getVehiclesByUserId(id_user: number) {
        const data = await this.vehicleRequestsRepository.query(`
            SELECT
                id,
                typeVehicle,
                licensePlate,
                year,
                brand,
                model,
                color,
                isActive,
                isMain,
                isVerified,
                created_at,
                updated_at
            FROM vehicles
            WHERE id_user = ${id_user}
        `);
        return data;
    }
}
