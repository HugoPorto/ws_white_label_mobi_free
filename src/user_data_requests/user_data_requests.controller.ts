import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { UserDataRequestsService } from './user_data_requests.service';
import { CreateUserDataRequestsDto } from './dto/create-user_data_requests.dto';

@Controller('user-data-requests')
export class UserDataRequestsController {
    
    constructor(private userDataRequestsService: UserDataRequestsService) { }

    @HasRoles(JwtRole.CLIENT, JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post() // http://localhost:3000/user-data-requests -> POST
    create(@Body() createUserDataRequestsDto: CreateUserDataRequestsDto) {
        return this.userDataRequestsService.create(createUserDataRequestsDto);
    }
}
