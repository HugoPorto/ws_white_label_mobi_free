import { Body, Controller, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientRequestsService } from './client_requests.service';
import { CreateClientRequestDto } from './dto/create_client_request.dto';
import { UpdateDriverAssignedClientRequestDto } from './dto/update_driver_assigned_client_request.dto';
import { UpdateStatusClientRequestDto } from './dto/update_status_client_request.dto';
import { UpdateDriverRatingDto } from './dto/update_driver_rating.dto';
import { UpdateClientRatingDto } from './dto/update_client_rating.dto';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from 'src/auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { UpdateDriverReportDto } from './dto/update_driver_report.dto';
import { UpdateClientReportDto } from './dto/update_client_report.dto';
import { UpdateDeliveryInfoDto } from './dto/update_delivery_info.dto';

@Controller('client-requests')
export class ClientRequestsController {
    constructor(private clientRequestsService: ClientRequestsService) { }

    // =======================================
    // ============== List's =================
    // =======================================
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':origin_lat/:origin_lng/:destination_lat/:destination_lng/:type_vehicle')
    getTimeAndDistanceClientRequest(
        @Param('origin_lat') origin_lat: number,
        @Param('origin_lng') origin_lng: number,
        @Param('destination_lat') destination_lat: number,
        @Param('destination_lng') destination_lng: number,
        @Param('type_vehicle') type_vehicle: boolean
    ) {
        return this.clientRequestsService.getTimeAndDistanceClientRequest(
            origin_lat,
            origin_lng,
            destination_lat,
            destination_lng,
            type_vehicle
        )
    }

    // ROTAS ESPECÍFICAS PRIMEIRO (devem vir antes das genéricas)
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('created/:id_client_request')
    getByClientRequestCreated(
        @Param('id_client_request') id_client_request: number,
    ) {
        return this.clientRequestsService.getByClientRequestCreated(id_client_request);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('driver/assigned/:id_driver')
    getByDriverAssigned(
        @Param('id_driver') id_driver: number,
    ) {
        return this.clientRequestsService.getByDriverAssigned(id_driver);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/assigned/:id_client')
    getByClientAssigned(
        @Param('id_client') id_client: number,
    ) {
        return this.clientRequestsService.getByClientAssigned(id_client);
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/assigned-common/:id_client')
    getByClientCommonAssigned(
        @Param('id_client') id_client: number,
    ) {
        return this.clientRequestsService.getByClientCommonAssigned(id_client);
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/assigned-delivery/:id_client')
    getByClientDeliveryAssigned(
        @Param('id_client') id_client: number,
    ) {
        return this.clientRequestsService.getByClientDeliveryAssigned(id_client);
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/assigned-scheduled/:id_client')
    getByClientScheduledAssigned(
        @Param('id_client') id_client: number,
    ) {
        return this.clientRequestsService.getByClientScheduledAssigned(id_client);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/created-schedule/:id_client') // http://[address]/client-requests/client/created-schedule/123
    getCreatedScheduleByClient(
        @Param('id_client') id_client: number,
    ) {
        return this.clientRequestsService.getCreatedScheduleByClient(id_client);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/assigned-schedule/:id_driver') // http://[address]/client-requests/client/assigned-schedule/123
    getCreatedScheduleByDriver(
        @Param('id_driver') id_driver: number,
    ) {
        return this.clientRequestsService.getCreatedScheduleByDriver(id_driver);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('client/assigned-common-to-driver/:id_driver') // http://[address]/client-requests/client/assigned-schedule/123
    getCreatedCommonByDriver(
        @Param('id_driver') id_driver: number,
    ) {
        return this.clientRequestsService.getCreatedCommonByDriver(id_driver);
    }

    // ROTAS GENÉRICAS DEPOIS (com parâmetros dinâmicos)
    // =========================================================
    // ============== OBTÉM SOLICITAÇÕES PRÓXIMAS ==============
    // =========================================================
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':driver_lat/:driver_lng/:id_driver/:vehicle_type') // http://[address]/client-requests/12.934567/-38.456789/123/car
    getNearbyTripRequest(
        @Param('driver_lat') driver_lat: number,
        @Param('driver_lng') driver_lng: number,
        @Param('id_driver') id_driver: number,
        @Param('vehicle_type') vehicle_type: string
    ) {
        return this.clientRequestsService.getNearbyTripRequest(
            driver_lat,
            driver_lng,
            id_driver,
            vehicle_type
        );
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':id_client_request')
    getByClientRequest(
        @Param('id_client_request') id_client_request: number,
    ) {
        return this.clientRequestsService.getByClientRequest(id_client_request);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('expired/:id') // http://[address]/client-requests/expired/123
    getByIdAndExpiredStatus(
        @Param('id') id: number,
    ) {
        return this.clientRequestsService.getByIdAndExpiredStatus(id);
    }

    // =======================================
    // ============== Create =================
    // =======================================
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Post()
    create(@Body() clientRequest: CreateClientRequestDto) {
        if (clientRequest.clientRequestType === 'scheduled') {
            return this.clientRequestsService.createTripSchedule(clientRequest);
        } else if(clientRequest.clientRequestType === 'delivery'){
            return this.clientRequestsService.createTripDelivery(clientRequest);
        } else {
            return this.clientRequestsService.create(clientRequest);
        }
    }

    // =======================================
    // ============== Update's ===============
    // =======================================
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put()
    updateDriverAssigned(@Body() driverAssigned: UpdateDriverAssignedClientRequestDto) {
        return this.clientRequestsService.updateDriverAssigned(driverAssigned);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update_status')
    updateStatus(@Body() updateStatusDto: UpdateStatusClientRequestDto) {
        return this.clientRequestsService.updateStatus(updateStatusDto);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update_driver_rating')
    updateDriverRating(@Body() driverRating: UpdateDriverRatingDto) {
        return this.clientRequestsService.updateDriverRating(driverRating);
    }

    @HasRoles(JwtRole.CLIENT)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update_driver_report')
    updateDriverReport(@Body() driverReport: UpdateDriverReportDto) {
        return this.clientRequestsService.updateDriverReport(driverReport);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update_client_rating')
    updateClientRating(@Body() clientRating: UpdateClientRatingDto) {
        return this.clientRequestsService.updateClientRating(clientRating);
    }

    @HasRoles(JwtRole.DRIVER)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update_client_report')
    updateClientReport(@Body() clientReport: UpdateClientReportDto) {
        return this.clientRequestsService.updateClientReport(clientReport);
    }

    // Upload da imagem do pacote (início da entrega)
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('upload_package_image/:id')
    @UseInterceptors(FileInterceptor('file'))
    uploadPackageImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                ],
            }),
        ) file: Express.Multer.File,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.clientRequestsService.uploadPackageImage(file, id);
    }

    // Upload da imagem do pacote (final da entrega)
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('upload_package_image_end/:id')
    @UseInterceptors(FileInterceptor('file'))
    uploadPackageImageEnd(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                ],
            }),
        ) file: Express.Multer.File,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.clientRequestsService.uploadPackageImageEnd(file, id);
    }

    // Verificar código de segurança
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('verify_delivery_code/:id/:code')
    verifyDeliveryCode(
        @Param('id', ParseIntPipe) id: number,
        @Param('code') code: string
    ) {
        return this.clientRequestsService.verifyDeliveryCode(id, code);
    }

    // Atualizar código inválido
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('update_invalid_code')
    updateInvalidCode(@Body() deliveryInfo: UpdateDeliveryInfoDto) {
        return this.clientRequestsService.updateInvalidCode(deliveryInfo);
    }

    // Validar código de entrega
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('validate_delivery_code/:id/:code')
    validateDeliveryCode(
        @Param('id', ParseIntPipe) id: number,
        @Param('code') code: string
    ) {
        return this.clientRequestsService.validateDeliveryCode(id, code);
    }

    // Verificar se solicitação está FINISHED ou CANCELLED
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get('check_finished_cancelled/:id')
    checkIfFinishedOrCancelled(
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.clientRequestsService.checkIfFinishedOrCancelled(id);
    }
}
