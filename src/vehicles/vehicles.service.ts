import { Injectable } from '@nestjs/common';
import { Veh } from './veh.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { User } from 'src/users/user.entity';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Veh) private vehiclesRepository: Repository<Veh>,
    ) { }

    async create(vehicle: CreateVehicleDto) {
        console.log('Creating vehicle:', vehicle);
        // Cria a instância do veículo sem o campo user
        const { id_user, ...vehicleData } = vehicle;
        const newVehicle = this.vehiclesRepository.create(vehicleData);
        // Associa o usuário ao veículo
        newVehicle.user = { id: id_user } as User;
        return this.vehiclesRepository.save(newVehicle);
    }

    async update(id: number, vehicle: UpdateVehicleDto) {
        const vehicleFound = await this.vehiclesRepository.findOneBy({ id: id });

        if (!vehicleFound) {
            throw new Error('Veículo não encontrado');
        }

        const updatedVehicle = Object.assign(vehicleFound, vehicle);

        return this.vehiclesRepository.save(updatedVehicle);
    }

    findAll() {
        return this.vehiclesRepository.find();
    }

    async toggleMainVehicle(vehicleId: number, userId: number) {
        console.log(`Toggling main vehicle - ID: ${vehicleId}, User ID: ${userId}`);

        // Buscar o veículo atual
        const currentVehicle = await this.vehiclesRepository.findOne({
            where: {
                id: vehicleId,
                user: { id: userId }
            },
            relations: ['user']
        });

        if (!currentVehicle) {
            throw new Error('Veículo não encontrado para este usuário');
        }

        const newIsMainValue = !currentVehicle.isMain;
        console.log(`Current isMain: ${currentVehicle.isMain}, New isMain: ${newIsMainValue}`);

        // Se estamos definindo como principal (true)
        if (newIsMainValue === true) {
            // Primeiro, definir todos os outros veículos deste usuário como não principais
            await this.vehiclesRepository.update(
                { user: { id: userId } },
                { isMain: false }
            );
            console.log(`Set all vehicles of user ${userId} to isMain = false`);
        }

        // Depois, atualizar o veículo específico
        await this.vehiclesRepository.update(
            { id: vehicleId },
            {
                isMain: newIsMainValue,
                updated_at: new Date()
            }
        );

        console.log(`Updated vehicle ${vehicleId} to isMain = ${newIsMainValue}`);

        // Retornar o veículo atualizado
        return this.vehiclesRepository.findOne({
            where: { id: vehicleId },
            relations: ['user']
        });
    }

    async getVehiclesByUserIdAndIsMainBKT(id_user: number) {
        const data = await this.vehiclesRepository.query(`
            SELECT
                id
            FROM vehicles
            WHERE id_user = ${id_user}
            AND isMain = true
            LIMIT 1
        `);
        return data[0] || null;
    }

    async getVehiclesByUserIdAndIsMain(id_user: number) {
        const data = await this.vehiclesRepository.query(`
            SELECT
                id
            FROM vehicles
            WHERE id_user = ${id_user}
            AND isMain = true AND isVerified = true
            LIMIT 1
        `);
        
        if (data && data.length > 0) {
            return { id: data[0].id };
        }
        
        return null;
    }
}
