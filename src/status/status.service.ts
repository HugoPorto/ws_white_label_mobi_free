import { Injectable } from '@nestjs/common';
import { Status } from './status.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateStatusDto } from './dto/create-status.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Logger } from '@nestjs/common';

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name);

    constructor(
        @InjectRepository(Status) private statusRepository: Repository<Status>,
        private configService: ConfigService,
    ) { }

    async create(createStatusDto: CreateStatusDto) {

        this.logger.debug('FILE: StatusService | FUNCTION: create | MESSAGE: Dados recebidos no createStatusDto:', createStatusDto);

        const token = this.configService.get<string>('TOKEN_MERCADO_PAGO');

        const dados = {
            transaction_amount: createStatusDto.amount,
            description: "Crédito para motorista",
            external_reference: "2",
            payment_method_id: "pix",
            notification_url: "https://api.fusion-sync.com/status/notifytwo",
            payer: {
                email: createStatusDto.email,
                first_name: createStatusDto.name,
                identification: {
                    type: "CPF",
                    number: createStatusDto.cpf,
                }
            },
        };

        const response = await axios.post('https://api.mercadopago.com/v1/payments', dados, {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'X-Idempotency-Key': `${new Date().toISOString()}-${Math.random()}`,
                Authorization: `Bearer ${token}`,
            },
        });

        const resultado = response.data;

        this.logger.debug('FILE: StatusService | FUNCTION: create | MESSAGE: Resultado:', resultado);

        if (resultado.error) {
            const errorId = `ERR_CREATE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Erro da API Mercado Pago ao criar pagamento:`, resultado);
            throw new Error(`Erro interno no processamento do pagamento. ID: ${errorId}`);
        }

        if (!resultado || !resultado.id || !resultado.status) {
            const errorId = `ERR_INVALID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Resultado inválido da API Mercado Pago:`, resultado);
            throw new Error(`Erro na resposta do processamento de pagamento. ID: ${errorId}`);
        }

        const status = this.statusRepository.create({
            name: createStatusDto.name,
            email: dados.payer.email,
            status: resultado.status,
            code: resultado.id,
            saleId: resultado.id,
            user: { id: createStatusDto.id_user },
            amount: createStatusDto.amount
        });

        const savedStatus = await this.statusRepository.save(status);

        this.logger.debug(`FILE: StatusService | FUNCTION: create | MESSAGE: Pagamento criado com sucesso - ID: ${savedStatus.id}`);

        return {
            ...savedStatus,
            qr_code: resultado.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: resultado.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: resultado.point_of_interaction?.transaction_data?.ticket_url,
        };
    }

    async findAll() {
        this.logger.debug('FILE: StatusService | FUNCTION: findAll | MESSAGE: Buscando todos os registros de status');
        
        try {
            const statusList = await this.statusRepository.find({
                relations: ['user'],
                order: {
                    id: 'DESC'
                }
            });

            this.logger.log(`FILE: StatusService | FUNCTION: findAll | MESSAGE: Encontrados ${statusList.length} registros de status`);

            return statusList.map(status => ({
                id: status.id,
                name: status.name,
                email: status.email,
                status: status.status,
                code: status.code,
                saleId: status.saleId,
                amount: status.amount,
                created_at: status.created_at,
                updated_at: status.updated_at,
                user: status.user ? {
                    id: status.user.id,
                    name: status.user.name,
                    email: status.user.email,
                    image: status.user.image
                } : null
            }));

        } catch (error: any) {
            const errorId = `ERR_FINDALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Erro ao buscar registros de status:`, error.message);
            throw new Error(`Erro interno ao buscar registros. ID: ${errorId}`);
        }
    }

    async findAllPaginated(page: number = 1, limit: number = 10) {
        this.logger.debug(`FILE: StatusService | FUNCTION: findAllPaginated | MESSAGE: Buscando registros paginados - Página: ${page}, Limite: ${limit}`);
        
        try {
            const offset = (page - 1) * limit;

            const [statusList, total] = await this.statusRepository.findAndCount({
                relations: ['user'],
                order: {
                    id: 'DESC'
                },
                take: limit,
                skip: offset
            });

            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            this.logger.log(`FILE: StatusService | FUNCTION: findAllPaginated | MESSAGE: Encontrados ${statusList.length} de ${total} registros - Página ${page}/${totalPages}`);

            const formattedData = statusList.map(status => ({
                id: status.id,
                name: status.name,
                email: status.email,
                status: status.status,
                code: status.code,
                saleId: status.saleId,
                amount: status.amount,
                created_at: status.created_at,
                updated_at: status.updated_at,
                user: status.user ? {
                    id: status.user.id,
                    name: status.user.name,
                    email: status.user.email
                } : null
            }));

            return {
                data: formattedData,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage,
                    hasPreviousPage
                }
            };

        } catch (error: any) {
            const errorId = `ERR_PAGINATED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Erro ao buscar registros paginados:`, error.message);
            throw new Error(`Erro interno ao buscar registros paginados. ID: ${errorId}`);
        }
    }

    async consultStatusPayment(paymentId: string) {
        this.logger.debug(`FILE: StatusService | FUNCTION: consultStatusPayment | MESSAGE: Consultando pagamento ID: ${paymentId}`);
        
        const token = this.configService.get<string>('TOKEN_MERCADO_PAGO');

        try {
            const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const resultado = response.data;

            this.logger.debug(`FILE: StatusService | FUNCTION: consultStatusPayment | MESSAGE: Consulta PIX ${paymentId} - Status: ${resultado.status}`);

            const statusEntity = await this.statusRepository.findOne({
                where: { code: paymentId },
                relations: ['user']
            });

            const id_user = statusEntity?.user?.id || null;

            if (statusEntity && statusEntity.status !== resultado.status) {
                statusEntity.status = resultado.status;
                await this.statusRepository.save(statusEntity);
                this.logger.debug(`FILE: StatusService | FUNCTION: consultStatusPayment | MESSAGE: Status atualizado no banco - ${paymentId}: ${resultado.status}`);
            }

            return {
                payment_id: paymentId,
                status: resultado.status,
                status_detail: resultado.status_detail,
                transaction_amount: resultado.transaction_amount,
                date_created: resultado.date_created,
                date_approved: resultado.date_approved,
                payment_method_id: resultado.payment_method_id,
                payment_type_id: resultado.payment_type_id,
                id_user: id_user,
                payer: {
                    email: resultado.payer?.email,
                    identification: resultado.payer?.identification
                }
            };

        } catch (error: any) {
            const errorId = `ERR_CONSULT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Erro ao consultar pagamento ${paymentId}:`, error.response?.data || error.message);
            throw new Error(`Erro ao consultar status do pagamento. ID: ${errorId}`);
        }
    }

    async updateByCodeAndUserId(code: string, status: string) {
        this.logger.debug(`FILE: StatusService | FUNCTION: updateByCodeAndUserId | MESSAGE: Atualizando status - Code: ${code}, Status: ${status}`);
        
        try {
            const statusEntity = await this.statusRepository.findOne({
                where: {
                    code: code
                },
                relations: ['user']
            });

            if (!statusEntity) {
                this.logger.warn(`FILE: StatusService | FUNCTION: updateByCodeAndUserId | MESSAGE: Status não encontrado para code: ${code}`);
                throw new Error(`Status não encontrado para o código informado`);
            }

            statusEntity.status = status;

            this.logger.debug('FILE: StatusService | FUNCTION: updateByCodeAndUserId | MESSAGE: Entidade de status antes da atualização:', statusEntity);

            const updatedStatus = await this.statusRepository.save(statusEntity);

            this.logger.debug(`FILE: StatusService | FUNCTION: updateByCodeAndUserId | MESSAGE: Status atualizado com sucesso - Code: ${code}, Novo status: ${status}`);

            this.logger.debug('FILE: StatusService | FUNCTION: updateByCodeAndUserId | MESSAGE: Entidade de status após atualização:', updatedStatus);

            return updatedStatus;

        } catch (error: any) {
            const errorId = `ERR_UPDATE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Erro ao atualizar status - Code: ${code}:`, error.message);
            throw new Error(`Erro interno ao atualizar status. ID: ${errorId}`);
        }
    }

    async findByUserId(userId: number) {
        this.logger.debug(`FILE: StatusService | FUNCTION: findByUserId | MESSAGE: Buscando últimos 10 registros do usuário ID: ${userId}`);
        
        try {
            const statusList = await this.statusRepository.find({
                where: {
                    user: { id: userId }
                },
                relations: ['user'],
                order: {
                    id: 'DESC'
                },
                take: 10
            });

            this.logger.log(`FILE: StatusService | FUNCTION: findByUserId | MESSAGE: Encontrados ${statusList.length} registros para o usuário ${userId}`);

            return statusList.map(status => ({
                id: status.id,
                name: status.name,
                email: status.email,
                status: status.status,
                code: status.code,
                saleId: status.saleId,
                amount: status.amount,
                created_at: status.created_at,
                updated_at: status.updated_at,
                user: status.user ? {
                    id: status.user.id,
                    name: status.user.name,
                    email: status.user.email
                } : null
            }));

        } catch (error: any) {
            const errorId = `ERR_FINDBYUSER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.logger.error(`[${errorId}] Erro ao buscar registros do usuário ${userId}:`, error.message);
            throw new Error(`Erro interno ao buscar registros do usuário. ID: ${errorId}`);
        }
    }
}
