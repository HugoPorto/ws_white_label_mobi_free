import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { Document, DocumentType, DocumentStatus } from './documents.entity';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { JwtRolesGuard } from '../auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';

@Controller('documents')
@UseGuards(JwtAuthGuard, JwtRolesGuard)
export class DocumentsController {

    constructor(private readonly documentsService: DocumentsService) { }

    // =============================================
    // CREATE - Criar novo documento
    // =============================================
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT)
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async create(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                ],
            }),
        ) file: Express.Multer.File,
        @Body() data: {
            idVehicle: number;
            idUser: number;
            documentType: DocumentType;
            fileUrl: string;
            fileName?: string;
            fileSize?: number;
            mimeType?: string;
            expirationDate?: string;
            notes?: string;
        }): Promise<Document> {
        console.log('📄 POST /documents - Criar documento:', data);

        // Converter string de data para Date se fornecido
        const documentData = {
            ...data,
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined
        };

        return await this.documentsService.create(file, documentData);
    }

    // =============================================
    // READ - Buscar documento por ID
    // =============================================
    @HasRoles(JwtRole.ADMIN, JwtRole.DRIVER, JwtRole.CLIENT)
    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<Document> {
        console.log('📄 GET /documents/:id - Buscar documento:', id);
        return await this.documentsService.findById(id);
    }

    // =============================================
    // READ - Buscar todos os documentos (com filtros)
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Get()
    async findAll(
        @Query('status') status?: DocumentStatus,
        @Query('documentType') documentType?: DocumentType,
        @Query('onlyActive') onlyActive?: string
    ): Promise<Document[]> {
        console.log('📄 GET /documents - Buscar todos os documentos');

        const filters = {
            status,
            documentType,
            onlyActive: onlyActive !== 'false'
        };

        return await this.documentsService.findAll(filters);
    }

    // =============================================
    // READ - Buscar documentos por veículo
    // =============================================
    @HasRoles(JwtRole.ADMIN, JwtRole.DRIVER, JwtRole.CLIENT)
    @Get('vehicle/:idVehicle')
    async findByVehicle(
        @Param('idVehicle', ParseIntPipe) idVehicle: number,
        @Query('onlyActive') onlyActive?: string
    ): Promise<Document[]> {
        console.log('📄 GET /documents/vehicle/:idVehicle - Buscar por veículo:', idVehicle);
        return await this.documentsService.findByVehicle(
            idVehicle,
            onlyActive !== 'false'
        );
    }

    // =============================================
    // READ - Buscar documentos por usuário
    // =============================================
    @HasRoles(JwtRole.DRIVER, JwtRole.CLIENT)
    @Get('user/:idUser')
    async findByUser(
        @Param('idUser', ParseIntPipe) idUser: number,
        @Query('session_id') session_id: string,
        @Query('onlyActive') onlyActive?: string
    ): Promise<Document[]> {
        console.log('📄 GET /documents/user/:idUser - Buscar por usuário:', idUser);
        console.log('🔑 Session ID:', session_id);
        
        return await this.documentsService.findByUser(
            idUser,
            onlyActive !== 'false',
            session_id
        );
    }

    // =============================================
    // READ - Buscar documentos por status
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Get('status/:status')
    async findByStatus(@Param('status') status: DocumentStatus): Promise<Document[]> {
        console.log('📄 GET /documents/status/:status - Buscar por status:', status);
        return await this.documentsService.findByStatus(status);
    }

    // =============================================
    // READ - Buscar documentos por tipo
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Get('type/:documentType')
    async findByType(
        @Param('documentType') documentType: DocumentType,
        @Query('onlyActive') onlyActive?: string
    ): Promise<Document[]> {
        console.log('📄 GET /documents/type/:documentType - Buscar por tipo:', documentType);
        return await this.documentsService.findByType(
            documentType,
            onlyActive !== 'false'
        );
    }

    // =============================================
    // UPDATE - Aprovar documento
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Put(':id/approve')
    async approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { reviewedBy: number; notes?: string }
    ): Promise<Document> {
        console.log('✅ PUT /documents/:id/approve - Aprovar documento:', id);
        return await this.documentsService.approve(id, data.reviewedBy, data.notes);
    }

    // =============================================
    // UPDATE - Aprovar todos os documentos de um veículo
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Put('vehicle/:idVehicle/approve-all')
    async approveAllByVehicle(
        @Param('idVehicle', ParseIntPipe) idVehicle: number,
        @Body() data: { reviewedBy: number; notes?: string }
    ): Promise<{ approved: Document[]; count: number }> {
        console.log('✅ PUT /documents/vehicle/:idVehicle/approve-all - Aprovar todos documentos:', idVehicle);
        return await this.documentsService.approveAllByVehicle(
            idVehicle,
            data.reviewedBy,
            data.notes
        );
    }

    // =============================================
    // UPDATE - Rejeitar documento
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Put(':id/reject')
    async reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { reviewedBy: number; reason: string }
    ): Promise<Document> {
        console.log('❌ PUT /documents/:id/reject - Rejeitar documento:', id);
        return await this.documentsService.reject(id, data.reviewedBy, data.reason);
    }

    // =============================================
    // UPDATE - Atualizar status genérico
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Put(':id/status')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: {
            status: DocumentStatus;
            reviewedBy: number;
            notes?: string
        }
    ): Promise<Document> {
        console.log('🔄 PUT /documents/:id/status - Atualizar status:', id, data.status);
        return await this.documentsService.updateStatus(
            id,
            data.status,
            data.reviewedBy,
            data.notes
        );
    }

    // =============================================
    // UPDATE - Marcar como expirado
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Put(':id/expire')
    async markAsExpired(@Param('id', ParseIntPipe) id: number): Promise<Document> {
        console.log('⏰ PUT /documents/:id/expire - Marcar como expirado:', id);
        return await this.documentsService.markAsExpired(id);
    }

    // =============================================
    // UPDATE - Atualizar notas
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Put(':id/notes')
    async updateNotes(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { notes: string }
    ): Promise<Document> {
        console.log('📝 PUT /documents/:id/notes - Atualizar notas:', id);
        return await this.documentsService.updateNotes(id, data.notes);
    }

    // =============================================
    // DELETE - Desativar documento (soft delete)
    // =============================================
    @HasRoles(JwtRole.ADMIN, JwtRole.DRIVER, JwtRole.CLIENT)
    @Delete(':id/deactivate')
    async deactivate(@Param('id', ParseIntPipe) id: number): Promise<Document> {
        console.log('🔒 DELETE /documents/:id/deactivate - Desativar documento:', id);
        return await this.documentsService.deactivate(id);
    }

    // =============================================
    // DELETE - Remover permanentemente
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
        console.log('🗑️ DELETE /documents/:id - Remover documento:', id);
        const success = await this.documentsService.delete(id);
        return { success };
    }

    // =============================================
    // UTILITY - Verificar documentos expirados
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Post('check-expired')
    async checkExpiredDocuments(): Promise<{
        expired: Document[];
        count: number;
    }> {
        console.log('⚠️ POST /documents/check-expired - Verificar documentos expirados');
        const expired = await this.documentsService.checkExpiredDocuments();
        return {
            expired,
            count: expired.length
        };
    }

    // =============================================
    // UTILITY - Verificar se veículo está totalmente documentado
    // =============================================
    @HasRoles(JwtRole.ADMIN, JwtRole.DRIVER, JwtRole.CLIENT)
    @Get('vehicle/:idVehicle/is-fully-documented')
    async isVehicleFullyDocumented(
        @Param('idVehicle', ParseIntPipe) idVehicle: number
    ): Promise<{ isFullyDocumented: boolean }> {
        console.log('✅ GET /documents/vehicle/:idVehicle/is-fully-documented - Verificar documentação:', idVehicle);
        const isFullyDocumented = await this.documentsService.isVehicleFullyDocumented(idVehicle);
        return { isFullyDocumented };
    }

    // =============================================
    // UTILITY - Obter estatísticas
    // =============================================
    @HasRoles(JwtRole.ADMIN)
    @Get('statistics/summary')
    async getStatistics(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        expired: number;
    }> {
        console.log('📊 GET /documents/statistics/summary - Obter estatísticas');
        return await this.documentsService.getStatistics();
    }
}
