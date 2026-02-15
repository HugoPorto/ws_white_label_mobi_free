import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { SocketGateway } from 'src/socket/socket.gateway';

@Controller('balance')
export class BalanceController {
    constructor(
        private balanceService: BalanceService,
        private socketGateway: SocketGateway,
    ) { }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post() // http://[address]/balance -> POST 
    create(@Body() balance: CreateBalanceDto) {
        return this.balanceService.create(balance);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update/user/:id_user') // http://[address]/balance/update/user/:id_user -> PUT
    update(@Param('id_user') id_user: number, @Body() balance: UpdateBalanceDto) {
        return this.balanceService.update(Number(id_user), balance);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update-common/user/:id_user') // http://[address]/balance/update-common/user/:id_user -> PUT
    updateCommon(@Param('id_user') id_user: number, @Body() balance: UpdateBalanceDto) {
        return this.balanceService.updateCommon(Number(id_user), balance);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('user/:id_user') // http://[address]/balance/user/:id_user -> GET
    findByUserId(@Param('id_user') id_user: number) {
        return this.balanceService.findByUserId(Number(id_user));
    }

    @Post('notify') // http://[address]/balance/notify -> POST
    notifyBalanceChange(@Body() data: any) {
        this.socketGateway.server.emit('pps2', data);
        
        return {
            success: true,
            message: 'Notificação de saldo enviada via socket',
            data: data
        };
    }
}