import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DriversPosition } from './drivers_position.entity';
import { CreateDriverPositionDto } from './dto/create_driver_position.dto';
import { DriversPositionService } from './drivers_position.service';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';

@Controller('drivers-position')
export class DriversPositionController {

    constructor(
        private driversPositionService: DriversPositionService
    ) { }

    // @HasRoles(JwtRole.ADMIN)
    // @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get() // http://localhost:3000/drivers-position -> GET
    findAll() {
        return this.driversPositionService.findAll();
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post() // http://localhost:3000/drivers-position
    create(@Body() driversPosition: CreateDriverPositionDto) {
        return this.driversPositionService.create(driversPosition)
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':id_driver')
    getDriverPosition(@Param('id_driver') id_driver: number) {
        return this.driversPositionService.getDriverPosition(id_driver);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':client_lat/:client_lng')
    getNearbyDrivers(@Param('client_lat') client_lat: number, @Param('client_lng') client_lng: number) {
        return this.driversPositionService.getNearbyDrivers(client_lat, client_lng);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Delete(':id_driver')
    delete(@Param('id_driver', ParseIntPipe) id_driver: number) {
        return this.driversPositionService.delete(id_driver);
    }


}
