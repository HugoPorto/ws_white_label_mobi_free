import { Body, Controller, Get, Post, UseGuards, Param, Query } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { SocketGateway } from 'src/socket/socket.gateway';
import { BalanceService } from 'src/balance/balance.service';
import { Logger } from '@nestjs/common';

@Controller('status')
export class StatusController {
    private readonly logger = new Logger(StatusController.name);

    constructor(
        private readonly statusService: StatusService,
        private socketGateway: SocketGateway,
        private readonly balanceService: BalanceService
    ) { }

    @HasRoles(JwtRole.DRIVER)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post()
    create(@Body() createStatusDto: CreateStatusDto) {
        return this.statusService.create(createStatusDto);
    }

    @HasRoles(JwtRole.ADMIN, JwtRole.DRIVER)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('all') // http://[address]/status/all -> GET
    findAll() {
        return this.statusService.findAll();
    }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('paginated')
    findAllPaginated(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const validPage = Math.max(1, pageNumber);
        const validLimit = Math.min(Math.max(1, limitNumber), 100);

        return this.statusService.findAllPaginated(validPage, validLimit);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('consult/:id')
    consultPayment(@Param('id') paymentId: string) {
        return this.statusService.consultStatusPayment(paymentId);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('user/:userId') // http://[address]/status/user/:userId -> GET
    findByUserId(@Param('userId') userId: string) {
        const userIdNumber = parseInt(userId, 10);
        if (isNaN(userIdNumber)) {
            throw new Error('ID do usuário deve ser um número válido');
        }
        return this.statusService.findByUserId(userIdNumber);
    }

    // [POSSÍVEL][VETOR DE ATAQUE]
    @Post('notifytwo')
    async notifyBalanceChangeTwo(@Body() data: any) {
        try {
            const updatedStatus = await this.statusService.consultStatusPayment(data.id);
            this.logger.debug('Status atualizado:', updatedStatus);
            this.socketGateway.server.emit('pps2', updatedStatus);

            return {
                success: true,
                message: 'Notificação de saldo enviada via socket',
            };
        } catch (error) {
            this.logger.error('Erro ao processar notificação:', error.message);
            return {
                success: false,
                message: 'Erro ao processar notificação',
                error: error.message
            };
        }
    }
}
