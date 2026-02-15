import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType, DocumentStatus } from './documents.entity';
import { User } from 'src/users/user.entity';
import { Veh } from 'src/vehicles/veh.entity';
import storage = require('../utils/cloud_storage');

@Injectable()
export class DocumentsService {

    constructor(
        @InjectRepository(Document)
        private documentsRepository: Repository<Document>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Veh)
        private vehiclesRepository: Repository<Veh>
    ) { }

    // =============================================
    // CREATE - Criar novo documento
    // =============================================
    async create(file: Express.Multer.File, data: {
        idVehicle: number;
        idUser: number;
        documentType: DocumentType;
        fileUrl: string;
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        expirationDate?: Date;
        notes?: string;
    }): Promise<Document> {
        try {
            const url = await storage(file, file.originalname);

            if (url === undefined && url === null) {
                throw new HttpException('Não foi possível salvar a imagem', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Validar se o veículo existe
            const vehicle = await this.vehiclesRepository.findOne({
                where: { id: data.idVehicle }
            });

            if (!vehicle) {
                throw new NotFoundException(`Veículo com ID ${data.idVehicle} não encontrado`);
            }

            // Validar se o usuário existe
            const user = await this.usersRepository.findOne({
                where: { id: data.idUser }
            });
            if (!user) {
                throw new NotFoundException(`Usuário com ID ${data.idUser} não encontrado`);
            }

            // Verificar se já existe um documento ativo do mesmo tipo para este veículo
            const existingDocument = await this.documentsRepository.findOne({
                where: {
                    vehicle: { id: data.idVehicle },
                    documentType: data.documentType,
                    isActive: true
                }
            });

            // Se existir, desativar o documento anterior
            if (existingDocument) {
                existingDocument.isActive = false;
                await this.documentsRepository.save(existingDocument);
            }

            // Criar novo documento
            const document = this.documentsRepository.create({
                vehicle: vehicle,
                user: user,
                documentType: data.documentType,
                fileUrl: url,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                expirationDate: data.expirationDate,
                notes: data.notes,
                status: DocumentStatus.PENDING,
                isActive: true
            });

            const savedDocument = await this.documentsRepository.save(document);
            console.log('✅ Documento criado com sucesso:', savedDocument.id);
            return savedDocument;

        } catch (error) {
            console.error('❌ Erro ao criar documento:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao criar documento',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // READ - Buscar documento por ID
    // =============================================
    async findById(id: number): Promise<Document> {
        try {
            const document = await this.documentsRepository.findOne({
                where: { id },
                relations: ['vehicle', 'user', 'reviewedBy']
            });

            if (!document) {
                throw new NotFoundException(`Documento com ID ${id} não encontrado`);
            }

            return document;
        } catch (error) {
            console.error('❌ Erro ao buscar documento:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao buscar documento',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // READ - Buscar documentos por veículo
    // =============================================
    async findByVehicle(idVehicle: number, onlyActive: boolean = true): Promise<Document[]> {
        try {
            const whereClause: any = { vehicle: { id: idVehicle } };
            if (onlyActive) {
                whereClause.isActive = true;
            }

            const documents = await this.documentsRepository.find({
                where: whereClause,
                relations: ['vehicle', 'user', 'reviewedBy'],
                order: { created_at: 'DESC' }
            });

            return documents;
        } catch (error) {
            console.error('❌ Erro ao buscar documentos do veículo:', error);
            throw new HttpException(
                'Erro ao buscar documentos do veículo',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // READ - Buscar documentos por usuário
    // =============================================
    async findByUser(idUser: number, onlyActive: boolean = true): Promise<Document[]> {
        try {
            const whereClause: any = { user: { id: idUser } };
            if (onlyActive) {
                whereClause.isActive = true;
            }

            const documents = await this.documentsRepository.find({
                where: whereClause,
                relations: ['vehicle', 'user', 'reviewedBy'],
                order: { created_at: 'DESC' }
            });

            return documents;
        } catch (error) {
            console.error('❌ Erro ao buscar documentos do usuário:', error);
            throw new HttpException(
                'Erro ao buscar documentos do usuário',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // READ - Buscar documentos por status
    // =============================================
    async findByStatus(status: DocumentStatus): Promise<Document[]> {
        try {
            const documents = await this.documentsRepository.find({
                where: { status, isActive: true },
                relations: ['vehicle', 'user', 'reviewedBy'],
                order: { created_at: 'DESC' }
            });

            return documents;
        } catch (error) {
            console.error('❌ Erro ao buscar documentos por status:', error);
            throw new HttpException(
                'Erro ao buscar documentos por status',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // READ - Buscar documentos por tipo
    // =============================================
    async findByType(documentType: DocumentType, onlyActive: boolean = true): Promise<Document[]> {
        try {
            const whereClause: any = { documentType };
            if (onlyActive) {
                whereClause.isActive = true;
            }

            const documents = await this.documentsRepository.find({
                where: whereClause,
                relations: ['vehicle', 'user', 'reviewedBy'],
                order: { created_at: 'DESC' }
            });

            return documents;
        } catch (error) {
            console.error('❌ Erro ao buscar documentos por tipo:', error);
            throw new HttpException(
                'Erro ao buscar documentos por tipo',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // READ - Buscar todos os documentos (com filtros opcionais)
    // =============================================
    async findAll(filters?: {
        status?: DocumentStatus;
        documentType?: DocumentType;
        onlyActive?: boolean;
    }): Promise<Document[]> {
        try {
            const whereClause: any = {};

            if (filters?.status) {
                whereClause.status = filters.status;
            }
            if (filters?.documentType) {
                whereClause.documentType = filters.documentType;
            }
            if (filters?.onlyActive !== false) {
                whereClause.isActive = true;
            }

            const documents = await this.documentsRepository.find({
                where: whereClause,
                relations: ['vehicle', 'user', 'reviewedBy'],
                order: { created_at: 'DESC' }
            });

            return documents;
        } catch (error) {
            console.error('❌ Erro ao buscar todos os documentos:', error);
            throw new HttpException(
                'Erro ao buscar documentos',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // UPDATE - Atualizar status do documento (aprovar/rejeitar)
    // =============================================
    async updateStatus(
        id: number,
        status: DocumentStatus,
        reviewedBy: number,
        notes?: string
    ): Promise<Document> {
        try {
            const document = await this.findById(id);

            // Validar se o revisor existe
            const reviewer = await this.usersRepository.findOne({
                where: { id: reviewedBy }
            });
            if (!reviewer) {
                throw new NotFoundException(`Usuário revisor com ID ${reviewedBy} não encontrado`);
            }

            document.status = status;
            document.reviewedBy = reviewer;
            document.reviewedAt = new Date();
            if (notes) {
                document.notes = notes;
            }

            const updatedDocument = await this.documentsRepository.save(document);
            console.log(`✅ Status do documento ${id} atualizado para ${status}`);
            return updatedDocument;

        } catch (error) {
            console.error('❌ Erro ao atualizar status do documento:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao atualizar status do documento',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // UPDATE - Aprovar documento
    // =============================================
    async approve(id: number, reviewedBy: number, notes?: string): Promise<Document> {
        return await this.updateStatus(id, DocumentStatus.APPROVED, reviewedBy, notes);
    }

    // =============================================
    // UPDATE - Rejeitar documento
    // =============================================
    async reject(id: number, reviewedBy: number, reason: string): Promise<Document> {
        if (!reason || reason.trim() === '') {
            throw new BadRequestException('Motivo da rejeição é obrigatório');
        }
        return await this.updateStatus(id, DocumentStatus.REJECTED, reviewedBy, reason);
    }

    // =============================================
    // UPDATE - Marcar documento como expirado
    // =============================================
    async markAsExpired(id: number): Promise<Document> {
        try {
            const document = await this.findById(id);
            document.status = DocumentStatus.EXPIRED;

            const updatedDocument = await this.documentsRepository.save(document);
            console.log(`✅ Documento ${id} marcado como expirado`);
            return updatedDocument;

        } catch (error) {
            console.error('❌ Erro ao marcar documento como expirado:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao marcar documento como expirado',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // UPDATE - Atualizar notas do documento
    // =============================================
    async updateNotes(id: number, notes: string): Promise<Document> {
        try {
            const document = await this.findById(id);
            document.notes = notes;

            const updatedDocument = await this.documentsRepository.save(document);
            console.log(`✅ Notas do documento ${id} atualizadas`);
            return updatedDocument;

        } catch (error) {
            console.error('❌ Erro ao atualizar notas do documento:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao atualizar notas do documento',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // DELETE - Desativar documento (soft delete)
    // =============================================
    async deactivate(id: number): Promise<Document> {
        try {
            const document = await this.findById(id);
            document.isActive = false;

            const updatedDocument = await this.documentsRepository.save(document);
            console.log(`✅ Documento ${id} desativado`);
            return updatedDocument;

        } catch (error) {
            console.error('❌ Erro ao desativar documento:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao desativar documento',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // DELETE - Remover documento permanentemente
    // =============================================
    async delete(id: number): Promise<boolean> {
        try {
            const document = await this.findById(id);
            await this.documentsRepository.remove(document);

            console.log(`✅ Documento ${id} removido permanentemente`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao remover documento:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao remover documento',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // UTILITY - Verificar documentos expirados
    // =============================================
    async checkExpiredDocuments(): Promise<Document[]> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const documents = await this.documentsRepository
                .createQueryBuilder('document')
                .where('document.expirationDate IS NOT NULL')
                .andWhere('document.expirationDate < :today', { today })
                .andWhere('document.status != :expired', { expired: DocumentStatus.EXPIRED })
                .andWhere('document.isActive = :isActive', { isActive: true })
                .leftJoinAndSelect('document.vehicle', 'vehicle')
                .leftJoinAndSelect('document.user', 'user')
                .getMany();

            // Marcar documentos como expirados
            for (const document of documents) {
                document.status = DocumentStatus.EXPIRED;
                await this.documentsRepository.save(document);
            }

            if (documents.length > 0) {
                console.log(`⚠️ ${documents.length} documentos marcados como expirados`);
            }

            return documents;

        } catch (error) {
            console.error('❌ Erro ao verificar documentos expirados:', error);
            throw new HttpException(
                'Erro ao verificar documentos expirados',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // UTILITY - Verificar se veículo tem todos os documentos aprovados
    // =============================================
    async isVehicleFullyDocumented(idVehicle: number): Promise<boolean> {
        try {
            const requiredDocumentTypes = [
                DocumentType.VEHICLE_REGISTRATION,
                DocumentType.DRIVER_LICENSE,
                DocumentType.VEHICLE_PHOTO
            ];

            for (const docType of requiredDocumentTypes) {
                const document = await this.documentsRepository.findOne({
                    where: {
                        vehicle: { id: idVehicle },
                        documentType: docType,
                        status: DocumentStatus.APPROVED,
                        isActive: true
                    }
                });

                if (!document) {
                    return false;
                }

                // Verificar se o documento não está expirado
                if (document.expirationDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (document.expirationDate < today) {
                        return false;
                    }
                }
            }

            return true;

        } catch (error) {
            console.error('❌ Erro ao verificar documentação do veículo:', error);
            throw new HttpException(
                'Erro ao verificar documentação do veículo',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============================================
    // UTILITY - Obter estatísticas de documentos
    // =============================================
    async getStatistics(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        expired: number;
    }> {
        try {
            const [total, pending, approved, rejected, expired] = await Promise.all([
                this.documentsRepository.count({ where: { isActive: true } }),
                this.documentsRepository.count({ where: { status: DocumentStatus.PENDING, isActive: true } }),
                this.documentsRepository.count({ where: { status: DocumentStatus.APPROVED, isActive: true } }),
                this.documentsRepository.count({ where: { status: DocumentStatus.REJECTED, isActive: true } }),
                this.documentsRepository.count({ where: { status: DocumentStatus.EXPIRED, isActive: true } })
            ]);

            return { total, pending, approved, rejected, expired };

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            throw new HttpException(
                'Erro ao obter estatísticas',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
