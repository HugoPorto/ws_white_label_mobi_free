import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateDriverCarInfoDto } from './dto/create_driver_car_info.dto';
import { DriverCarInfoService } from './driver_car_info.service';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';

@Controller('driver-car-info')
export class DriverCarInfoController {

    constructor(private driverCarInfoService: DriverCarInfoService) { }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':id_driver')
    findByIdDriver(@Param('id_driver') id_driver: number) {
        return this.driverCarInfoService.findByIdDriver(id_driver);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post()
    create(@Body() driverCarInfo: CreateDriverCarInfoDto) {
        return this.driverCarInfoService.create(driverCarInfo);
    }

}
