import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Veh } from './veh.entity';
import { User } from 'src/users/user.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleRequestsService } from './vehicle_requests.service';

@Module({
    imports: [TypeOrmModule.forFeature([ Veh, User ])],
    providers: [VehiclesService, VehicleRequestsService],
    controllers: [VehiclesController]
})
export class VehiclesModule {}
