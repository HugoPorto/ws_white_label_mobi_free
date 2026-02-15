import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { VehicleRequestsService } from './vehicle_requests.service';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
    constructor(
        private vehiclesService: VehiclesService,
        private vehicleRequestsService: VehicleRequestsService
    ) { }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post() // http://[address]/vehicle -> POST 
    create(@Body() vehicle: CreateVehicleDto) {
        return this.vehiclesService.create(vehicle);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get() // http://[address]/vehicles -> GET
    findAll() {
        return this.vehiclesService.findAll();
    }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put(':id') // http://192.168.1.15:3000/vehicles/:id -> PUT 
    update(@Param('id', ParseIntPipe) id: number, @Body() vehicle: UpdateVehicleDto) {
        return this.vehiclesService.update(id, vehicle);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':id_user') // http://[address]/vehicle/:id -> GET
    getVehiclesByUserId(
        @Param('id_user') id_user: number,
    ) {
        return this.vehicleRequestsService.getVehiclesByUserId(id_user);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('main/:id_user') // http://[address]/vehicles/main/:id_user -> GET
    getMainVehicleByUserId(
        @Param('id_user') id_user: number,
    ) {
        return this.vehiclesService.getVehiclesByUserIdAndIsMain(id_user);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put(':vehicleId/toggle-main/:userId') // http://[address]/vehicles/:vehicleId/toggle-main/:userId -> PUT
    toggleMainVehicle(
        @Param('vehicleId') vehicleId: number,
        @Param('userId') userId: number
    ) {
        return this.vehiclesService.toggleMainVehicle(vehicleId, userId);
    }
}
