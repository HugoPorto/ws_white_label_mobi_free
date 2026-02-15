import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { TimeAndDistanceValuesService } from './time_and_distance_values.service';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { UpdateTimeAndDistanceDto } from './dto/update-time-and-distance.dto';

@Controller('time-and-distance-values')
export class TimeAndDistanceValuesController {
    constructor(private timeAndDistanceValuesService: TimeAndDistanceValuesService) { }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get()
    getTimeAndDistanceClientRequest() {
        return this.timeAndDistanceValuesService.find();
    }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put()
    updateTimeAndDistanceValues(@Body() timeAndDistance: UpdateTimeAndDistanceDto) {
        return this.timeAndDistanceValuesService.update(timeAndDistance);
    }
}
