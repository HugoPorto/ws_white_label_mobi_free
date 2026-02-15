import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DriverTripOffersService } from './driver_trip_offers.service';
import { CreateDriverTripOffersDto } from './dto/create_driver_trip_offers.dto';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';

@Controller('driver-trip-offers')
export class DriverTripOffersController {

    constructor(private driverTripOffersService: DriverTripOffersService) { }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('findByClientRequest/:id_client_request')
    findByClientRequest(@Param('id_client_request') id_client_request: number) {
        return this.driverTripOffersService.findByClientRequest(id_client_request);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post()
    create(@Body() driverTripOffer: CreateDriverTripOffersDto) {
        return this.driverTripOffersService.create(driverTripOffer);
    }

}
