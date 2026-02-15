import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ClientRequestsAdminService } from './client_requests_admin.service';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';

@Controller('client-requests-admin')
export class ClientRequestsAdminController {
    constructor(private ClientRequestsAdminService: ClientRequestsAdminService) { }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':origin_lat/:origin_lng/:destination_lat/:destination_lng/:type_vehicle')
    getTimeAndDistanceClientRequest(
        @Param('origin_lat') origin_lat: number,
        @Param('origin_lng') origin_lng: number,
        @Param('destination_lat') destination_lat: number,
        @Param('destination_lng') destination_lng: number,
        @Param('type_vehicle') type_vehicle: boolean
    ) {
        return this.ClientRequestsAdminService.getTimeAndDistanceClientRequest(
            origin_lat,
            origin_lng,
            destination_lat,
            destination_lng,
            type_vehicle
        )
    }
}
