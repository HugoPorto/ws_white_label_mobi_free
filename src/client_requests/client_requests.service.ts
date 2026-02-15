import { Client, DistanceMatrixResponseData, TravelMode } from '@googlemaps/google-maps-services-js';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TimeAndDistanceValuesService } from '../time_and_distance_values/time_and_distance_values.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientRequests, Status, ClientRequestType, VehicleType } from './client_requests.entity';
import { CreateClientRequestDto } from './dto/create_client_request.dto';
import { UpdateDriverAssignedClientRequestDto } from './dto/update_driver_assigned_client_request.dto';
import { UpdateStatusClientRequestDto } from './dto/update_status_client_request.dto';
import { UpdateDriverRatingDto } from './dto/update_driver_rating.dto';
import { UpdateClientRatingDto } from './dto/update_client_rating.dto';
import { FirebaseRepository } from 'src/firebase/firebase.repository';
import { UpdateDriverReportDto } from './dto/update_driver_report.dto';
import { UpdateClientReportDto } from './dto/update_client_report.dto';
import { UpdateDeliveryInfoDto } from './dto/update_delivery_info.dto';
import { User } from 'src/users/user.entity';
import storage = require('../utils/cloud_storage');
const API_KEY = 'GOOGLE_API_KEY';

@Injectable()
export class ClientRequestsService extends Client {

    constructor(
        @InjectRepository(ClientRequests) private clientRequestsRepository: Repository<ClientRequests>,
        @InjectRepository(User) private usersRepository: Repository<User>,
        private timeAndDistanceValuesService: TimeAndDistanceValuesService,
        private firebaseRepository: FirebaseRepository
    ) {
        super();
    }

    async create(clientRequest: CreateClientRequestDto) {
        try {
            // Insere a solicitação do cliente com SRID 4326
            await this.clientRequestsRepository.query(`
                INSERT INTO
                    client_requests(
                        id_client,
                        fare_offered,
                        pickup_description,
                        destination_description,
                        pickup_position,
                        destination_position,
                        vehicle_type,
                        distance_text,
                        distance_value,
                        duration_text,
                        duration_value,
                        recommended_value,
                        km_value,
                        min_value
                    )
                VALUES(
                    ${clientRequest.id_client},
                    ${clientRequest.fare_offered},
                    '${clientRequest.pickup_description}',
                    '${clientRequest.destination_description}',
                    ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326),
                    ST_GeomFromText('POINT(${clientRequest.destination_lat} ${clientRequest.destination_lng})', 4326),
                    '${clientRequest.vehicle_type}',
                    '${clientRequest.distance_text}',
                    ${clientRequest.distance_value},
                    '${clientRequest.duration_text}',
                    ${clientRequest.duration_value},
                    ${clientRequest.recommended_value},
                    ${clientRequest.km_value},
                    ${clientRequest.min_value}

                )
            `);

            // Pega o último id inserido
            const data = await this.clientRequestsRepository.query(`SELECT MAX(id) AS id FROM client_requests`);

            // Busca motoristas próximos (forçando SRID do campo position para 4326)
            const nearbyDrivers = await this.clientRequestsRepository.query(`
            SELECT
                U.id,
                U.name,
                U.notification_token,
                DP.position,
                ST_Distance_Sphere(
                    ST_SRID(DP.position, 4326),
                    ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326)
                ) AS distance
            FROM
                users AS U
            LEFT JOIN
                drivers_position AS DP
            ON
                U.id = DP.id_driver    
            HAVING
                distance < 20000
            `);

            // Aqui você pode usar os nearbyDrivers se precisar enviar notificação, etc.
            console.log('MOTORISTAS PRÓXIMOS:', nearbyDrivers);

            const notificationTokens = [];

            nearbyDrivers.forEach((driver, index) => {
                if (!notificationTokens.includes(driver.notification_token)) {
                    if (driver.notification_token !== null) {
                        if (driver.notification_token !== '') {
                            notificationTokens.push(driver.notification_token);
                        }
                    }
                }
            });

            console.log('NOTIFICATION TOKEN:', notificationTokens);

            this.firebaseRepository.sendMessageToMultipleDevices({
                "tokens": notificationTokens,
                "notification": {
                    "title": "SOLICITAÇÃO DE VIAGEM",
                    "body": clientRequest.pickup_description
                },
                "data": {
                    "id_client_requets": `${data[0].id}`,
                    "type": 'CLIENT_REQUEST',
                },
                "android": {
                    "priority": "high",
                    "ttl": 180
                },
                "apns": {
                    "headers": {
                        "apns-priority": "5",
                        "apns-expiration": "180"
                    }
                }
            });

            return Number(data[0].id);
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createTripSchedule(clientRequest: CreateClientRequestDto) {
        try {
            // Converte scheduledFor de ISO string para MySQL datetime format
            let scheduledForMysql = null;
            if (clientRequest.scheduledFor) {
                const date = new Date(clientRequest.scheduledFor);
                scheduledForMysql = date.toISOString().slice(0, 19).replace('T', ' ');
            }

            // Insere a solicitação do cliente com SRID 4326
            await this.clientRequestsRepository.query(`
                INSERT INTO
                    client_requests(
                        id_client,
                        fare_offered,
                        pickup_description,
                        destination_description,
                        pickup_position,
                        destination_position,
                        vehicle_type,
                        scheduledFor,
                        pickup_description_plus,
                        destination_description_plus,
                        tolerance_minutes,
                        clientRequestType,
                        distance_text,
                        distance_value,
                        duration_text,
                        duration_value,
                        recommended_value,
                        km_value,
                        min_value
                    )
                VALUES(
                    ${clientRequest.id_client},
                    ${clientRequest.fare_offered},
                    '${clientRequest.pickup_description}',
                    '${clientRequest.destination_description}',
                    ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326),
                    ST_GeomFromText('POINT(${clientRequest.destination_lat} ${clientRequest.destination_lng})', 4326),
                    '${clientRequest.vehicle_type}',
                    '${scheduledForMysql}',
                    '${clientRequest.pickup_description_plus}',
                    '${clientRequest.destination_description_plus}',
                    '${clientRequest.tolerance_minutes}',
                    '${clientRequest.clientRequestType}',
                    '${clientRequest.distance_text}',
                    ${clientRequest.distance_value},
                    '${clientRequest.duration_text}',
                    ${clientRequest.duration_value},
                    ${clientRequest.recommended_value},
                    ${clientRequest.km_value},
                    ${clientRequest.min_value}
                )
            `);

            // Pega o último id inserido
            const data = await this.clientRequestsRepository.query(`SELECT MAX(id) AS id FROM client_requests`);

            // Busca motoristas próximos (forçando SRID do campo position para 4326)
            const nearbyDrivers = await this.clientRequestsRepository.query(`
            SELECT
                U.id,
                U.name,
                U.notification_token,
                DP.position,
                ST_Distance_Sphere(
                    ST_SRID(DP.position, 4326),
                    ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326)
                ) AS distance
            FROM
                users AS U
            LEFT JOIN
                drivers_position AS DP
            ON
                U.id = DP.id_driver    
            HAVING
                distance < 20000
            `);

            // Aqui você pode usar os nearbyDrivers se precisar enviar notificação, etc.
            console.log('Motoristas próximos:', nearbyDrivers);

            return Number(data[0].id);
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createTripDelivery(clientRequest: CreateClientRequestDto) {
        console.log('Creating delivery trip request:', clientRequest);
        try {
            await this.clientRequestsRepository.query(`
                INSERT INTO
                    client_requests(
                        id_client,
                        fare_offered,
                        pickup_description,
                        destination_description,
                        vehicle_type,
                        clientRequestType,
                        pickup_position,
                        destination_position,
                        distance_text,
                        distance_value,
                        duration_text,
                        duration_value,
                        recommended_value,
                        km_value,
                        min_value,
                        package_details,
                        package_weight,
                        package_type,
                        is_fragile,
                        sender_name,
                        sender_phone,
                        receiver_name,
                        receiver_phone,
                        receiver_cpf,
                        code
                    )
                VALUES(
                    ${clientRequest.id_client},
                    ${clientRequest.fare_offered},
                    '${clientRequest.pickup_description}',
                    '${clientRequest.destination_description}',
                    '${clientRequest.vehicle_type}',
                    '${clientRequest.clientRequestType}',
                    ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326),
                    ST_GeomFromText('POINT(${clientRequest.destination_lat} ${clientRequest.destination_lng})', 4326),
                    '${clientRequest.distance_text}',
                    ${clientRequest.distance_value},
                    '${clientRequest.duration_text}',
                    ${clientRequest.duration_value},
                    ${clientRequest.recommended_value},
                    ${clientRequest.km_value},
                    ${clientRequest.min_value},
                    '${clientRequest.package_details}',
                    '${clientRequest.package_weight}',
                    '${clientRequest.package_type}',
                    ${clientRequest.is_fragile},
                    '${clientRequest.sender_name}',
                    '${clientRequest.sender_phone}',
                    '${clientRequest.receiver_name}',
                    '${clientRequest.receiver_phone}',
                    '${clientRequest.receiver_cpf}',
                    '${clientRequest.code}'
                )
            `);

            // Pega o último id inserido
            const data = await this.clientRequestsRepository.query(`SELECT MAX(id) AS id FROM client_requests`);

            // Busca motoristas próximos (forçando SRID do campo position para 4326)
            const nearbyDrivers = await this.clientRequestsRepository.query(`
            SELECT
                U.id,
                U.name,
                U.notification_token,
                DP.position,
                ST_Distance_Sphere(
                    ST_SRID(DP.position, 4326),
                    ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326)
                ) AS distance
            FROM
                users AS U
            LEFT JOIN
                drivers_position AS DP
            ON
                U.id = DP.id_driver    
            HAVING
                distance < 20000
            `);

            // Aqui você pode usar os nearbyDrivers se precisar enviar notificação, etc.
            console.log('Motoristas próximos:', nearbyDrivers);

            return Number(data[0].id);
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateDriverAssigned(driverAssigned: UpdateDriverAssignedClientRequestDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    id_driver_assigned = ${driverAssigned.id_driver_assigned},
                    status = '${Status.ACCEPTED}',
                    updated_at = NOW(),
                    fare_assigned = ${driverAssigned.fare_assigned}
                WHERE
                    id = ${driverAssigned.id}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateStatusBkt(updateStatusDto: UpdateStatusClientRequestDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    status = '${updateStatusDto.status}',
                    updated_at = NOW()
                WHERE
                    id = ${updateStatusDto.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateStatus(updateStatusDto: UpdateStatusClientRequestDto) {
        try {
            // VERIFICA SE É DELIVERY E STATUS FINISHED PARA ATUALIZAR INVALID_CODE
            if (updateStatusDto.status === Status.FINISHED) {
                // BUSCA O REGISTRO PARA VERIFICAR SE É DELIVERY
                const clientRequest = await this.clientRequestsRepository.query(`
                    SELECT id, clientRequestType, code 
                    FROM client_requests 
                    WHERE id = ${updateStatusDto.id_client_request} 
                    LIMIT 1
                `);

                if (clientRequest && clientRequest.length > 0) {
                    const request = clientRequest[0];

                    // SE FOR DELIVERY, ATUALIZA TAMBÉM O INVALID_CODE COM O VALOR DO CODE
                    if (request.clientRequestType === ClientRequestType.DELIVERY) {
                        console.log('🚚 Delivery finalizada - Atualizando invalid_code com o código:', request.code);

                        await this.clientRequestsRepository.query(`
                            UPDATE
                                client_requests
                            SET
                                status = '${updateStatusDto.status}',
                                invalid_code = code,
                                updated_at = NOW()
                            WHERE
                                id = ${updateStatusDto.id_client_request}
                        `);

                        return true;
                    }
                }
            }

            if (updateStatusDto.status === Status.CANCELLED) {
                // VERIFICA SE A SOLICITAÇÃO JÁ ESTÁ FINALIZADA
                const clientRequest = await this.clientRequestsRepository.query(`
                    SELECT id, status 
                    FROM client_requests 
                    WHERE id = ${updateStatusDto.id_client_request} 
                    LIMIT 1
                `);

                if (clientRequest && clientRequest.length > 0) {
                    const currentStatus = clientRequest[0].status;
                    
                    // SE JÁ ESTIVER FINALIZADA, NÃO PERMITE CANCELAR
                    if (currentStatus === Status.FINISHED) {
                        return { success: false, message: 'FINISHED' };
                    }
                }
            }

            // FLUXO ORIGINAL PARA OUTROS CASOS
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    status = '${updateStatusDto.status}',
                    updated_at = NOW()
                WHERE
                    id = ${updateStatusDto.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateDriverRatingBase(driverRating: UpdateDriverRatingDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    driver_rating = '${driverRating.driver_rating}',
                    updated_at = NOW()
                WHERE
                    id = ${driverRating.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateDriverRating(driverRating: UpdateDriverRatingDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    driver_rating = '${driverRating.driver_rating}',
                    updated_at = NOW()
                WHERE
                    id = ${driverRating.id_client_request}
            `);

            const clientData = await this.clientRequestsRepository.query(`
                SELECT id_driver_assigned FROM client_requests WHERE id = ${driverRating.id_client_request} LIMIT 1
            `);

            const idDriver = (clientData && clientData.length > 0) ? Number(clientData[0].id_driver_assigned) : null;

            if (!idDriver) {
                return 0;
            }

            const sumResult = await this.clientRequestsRepository.query(`
                SELECT 
                    COALESCE(SUM(CAST(driver_rating AS DECIMAL(10,2))), 0) AS total_driver_rating,
                    COUNT(driver_rating) AS count_ratings
                FROM 
                    client_requests
                WHERE 
                    id_driver_assigned = ${idDriver} AND driver_rating IS NOT NULL
            `);

            const totalDriverRating = sumResult && sumResult.length > 0 ? Number(sumResult[0].total_driver_rating) : 0;

            const countRatings = sumResult && sumResult.length > 0 ? Number(sumResult[0].count_ratings) : 0;

            if (countRatings === 0) {
                // Se não houver avaliações, zera o rating geral
                await this.usersRepository.query(`
                    UPDATE users
                    SET general_driver_rating = 0
                    WHERE id = ${idDriver}
                `);
                return 0;
            }

            const average = totalDriverRating / countRatings;
            const ratingGeral = Math.round(average * 100) / 100; // arredonda para 2 casas

            await this.usersRepository.query(`
                UPDATE users
                SET general_driver_rating = ${ratingGeral}
                WHERE id = ${idDriver}
            `);

            return true;
        } catch (error) {
            console.log('Erro ao atualizar a avaliação do motorista', error);
            throw new HttpException('Erro do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateDriverReport(driverReport: UpdateDriverReportDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    driver_report = '${driverReport.driver_report}',
                    updated_at = NOW()
                WHERE
                    id = ${driverReport.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateClientReport(clientReport: UpdateClientReportDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    client_report = '${clientReport.client_report}',
                    updated_at = NOW()
                WHERE
                    id = ${clientReport.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async uploadPackageImage(file: Express.Multer.File, id_client_request: number) {
        try {
            const url = await storage(file, file.originalname);
            console.log('URL da imagem do pacote: ' + url);

            if (url === undefined || url === null) {
                throw new HttpException('Não foi possível salvar a imagem', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Verifica se a solicitação existe usando query manual
            const clientRequestCheck = await this.clientRequestsRepository.query(`
                SELECT id FROM client_requests WHERE id = ${id_client_request} LIMIT 1
            `);

            if (!clientRequestCheck || clientRequestCheck.length === 0) {
                throw new HttpException('Solicitação não encontrada', HttpStatus.NOT_FOUND);
            }

            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    image_package = '${url}',
                    updated_at = NOW()
                WHERE
                    id = ${id_client_request}
            `);

            return { success: true, image_url: url };
        } catch (error) {
            console.log('Error ao fazer upload da imagem do pacote', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async uploadPackageImageEnd(file: Express.Multer.File, id_client_request: number) {
        try {
            const url = await storage(file, file.originalname);
            console.log('URL da imagem do pacote (final): ' + url);

            if (url === undefined || url === null) {
                throw new HttpException('Não foi possível salvar a imagem', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Verifica se a solicitação existe usando query manual
            const clientRequestCheck = await this.clientRequestsRepository.query(`
                SELECT id FROM client_requests WHERE id = ${id_client_request} LIMIT 1
            `);

            if (!clientRequestCheck || clientRequestCheck.length === 0) {
                throw new HttpException('Solicitação não encontrada', HttpStatus.NOT_FOUND);
            }

            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    image_package_end = '${url}',
                    updated_at = NOW()
                WHERE
                    id = ${id_client_request}
            `);

            return { success: true, image_url: url };
        } catch (error) {
            console.log('Error ao fazer upload da imagem do pacote (final)', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateDeliveryCode(deliveryInfo: UpdateDeliveryInfoDto) {
        try {
            if (!deliveryInfo.code) {
                throw new HttpException('Código de segurança é obrigatório', HttpStatus.BAD_REQUEST);
            }

            // Verifica se a solicitação existe usando query manual
            const clientRequestCheck = await this.clientRequestsRepository.query(`
                SELECT id FROM client_requests WHERE id = ${deliveryInfo.id_client_request} LIMIT 1
            `);

            if (!clientRequestCheck || clientRequestCheck.length === 0) {
                throw new HttpException('Solicitação não encontrada', HttpStatus.NOT_FOUND);
            }

            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    code = '${deliveryInfo.code}',
                    updated_at = NOW()
                WHERE
                    id = ${deliveryInfo.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error atualizando código de segurança', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async verifyDeliveryCode(id_client_request: number, code: string) {
        try {
            // Busca o código usando query manual
            const clientRequest = await this.clientRequestsRepository.query(`
                SELECT id, code FROM client_requests WHERE id = ${id_client_request} LIMIT 1
            `);

            if (!clientRequest || clientRequest.length === 0) {
                throw new HttpException('Solicitação não encontrada', HttpStatus.NOT_FOUND);
            }

            if (!clientRequest[0].code) {
                throw new HttpException('Código de segurança não configurado para esta entrega', HttpStatus.BAD_REQUEST);
            }

            const isValid = clientRequest[0].code === code;

            return {
                valid: isValid,
                message: isValid ? 'Código válido' : 'Código inválido'
            };
        } catch (error) {
            console.log('Error verificando código de segurança', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateInvalidCode(deliveryInfo: UpdateDeliveryInfoDto) {
        try {
            if (!deliveryInfo.invalid_code) {
                throw new HttpException('Código inválido é obrigatório', HttpStatus.BAD_REQUEST);
            }

            // Verifica se a solicitação existe usando query manual
            const clientRequestCheck = await this.clientRequestsRepository.query(`
                SELECT id FROM client_requests WHERE id = ${deliveryInfo.id_client_request} LIMIT 1
            `);

            if (!clientRequestCheck || clientRequestCheck.length === 0) {
                throw new HttpException('Solicitação não encontrada', HttpStatus.NOT_FOUND);
            }

            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    invalid_code = '${deliveryInfo.invalid_code}',
                    updated_at = NOW()
                WHERE
                    id = ${deliveryInfo.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error atualizando código inválido', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Valida se um código é válido para uma solicitação de cliente
     * Retorna true se o código for válido (existe no campo 'code' e não existe no campo 'invalid_code')
     * Retorna false se o código for inválido ou já estiver marcado como inválido
     */
    async validateDeliveryCode(id_client_request: number, code: string) {
        try {
            console.log('🔐 Validando código de entrega:', { id_client_request, code });

            if (!code || code.length !== 6) {
                console.log('❌ Código inválido: deve ter 6 dígitos');
                return false;
            }

            // Busca a solicitação pelo ID
            const clientRequest = await this.clientRequestsRepository.query(`
                SELECT id, code, invalid_code 
                FROM client_requests 
                WHERE id = ${id_client_request} 
                LIMIT 1
            `);

            if (!clientRequest || clientRequest.length === 0) {
                console.log('❌ Solicitação não encontrada');
                throw new HttpException('Solicitação não encontrada', HttpStatus.NOT_FOUND);
            }

            const request = clientRequest[0];

            // Verifica se o código informado é o código correto (campo 'code')
            if (request.code !== code) {
                console.log('❌ Código não corresponde ao código correto');
                return false;
            }

            // Verifica se o código NÃO está no campo invalid_code
            if (request.invalid_code === code) {
                console.log('❌ Código foi marcado como inválido anteriormente');
                return false;
            }

            console.log('✅ Código válido!');
            return true;

        } catch (error) {
            console.log('❌ Erro ao validar código de entrega:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Erro ao validar código', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateClientRatingBase(driverRating: UpdateClientRatingDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    client_rating = '${driverRating.client_rating}',
                    updated_at = NOW()
                WHERE
                    id = ${driverRating.id_client_request}
            `);

            return true;
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateClientRating(driverRating: UpdateClientRatingDto) {
        try {
            await this.clientRequestsRepository.query(`
                UPDATE
                    client_requests
                SET
                    client_rating = '${driverRating.client_rating}',
                    updated_at = NOW()
                WHERE
                    id = ${driverRating.id_client_request}
            `);

            const clientData = await this.clientRequestsRepository.query(`
                SELECT id_client FROM client_requests WHERE id = ${driverRating.id_client_request} LIMIT 1
            `);

            const idClient = (clientData && clientData.length > 0) ? Number(clientData[0].id_client) : null;

            if (!idClient) {
                return 0;
            }

            const sumResult = await this.clientRequestsRepository.query(`
                SELECT 
                    COALESCE(SUM(CAST(client_rating AS DECIMAL(10,2))), 0) AS total_client_rating,
                    COUNT(client_rating) AS count_ratings
                FROM 
                    client_requests
                WHERE 
                    id_client = ${idClient} AND client_rating IS NOT NULL
            `);

            const totalClientRating = sumResult && sumResult.length > 0 ? Number(sumResult[0].total_client_rating) : 0;

            const countRatings = sumResult && sumResult.length > 0 ? Number(sumResult[0].count_ratings) : 0;

            if (countRatings === 0) {
                // Se não houver avaliações, zera o rating geral
                await this.usersRepository.query(`
                    UPDATE users
                    SET general_client_rating = 0
                    WHERE id = ${idClient}
                `);
                return 0;
            }

            const average = totalClientRating / countRatings;
            const ratingGeral = Math.round(average * 100) / 100; // arredonda para 2 casas

            await this.usersRepository.query(`
                UPDATE users
                SET general_client_rating = ${ratingGeral}
                WHERE id = ${idClient}
            `);

            return true;

        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getByClientRequest(id_client_request: number) {
        console.log('🔍 Buscando solicitação de viagem criada ID:', id_client_request);
        const data = await this.clientRequestsRepository.query(`
        SELECT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.clientRequestType,
            CR.code,
            JSON_OBJECT(
                "name", U.name,
                "lastname", U.lastname,
                "phone", U.phone,
                "image", U.image
            ) AS client,
            JSON_OBJECT(
                "name", D.name,
                "lastname", D.lastname,
                "phone", D.phone,
                "image", D.image
            ) AS driver,
            JSON_OBJECT(
                "brand", DCI.brand,
                "plate", DCI.plate,
                "color", DCI.color
            ) AS car
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            driver_car_info AS DCI
        ON
            DCI.id_driver = CR.id_driver_assigned
        WHERE
            CR.id = ${id_client_request} AND CR.status = '${Status.ACCEPTED}'
        `);
        return {
            ...data[0],
            'pickup_lat': data[0].pickup_position.y,
            'pickup_lng': data[0].pickup_position.x,
            'destination_lat': data[0].destination_position.y,
            'destination_lng': data[0].destination_position.x,
        };
    }

    async getByClientRequestCreated(id_client_request: number) {
        console.log('🔍 Buscando solicitação de viagem criada ID:', id_client_request);
        const data = await this.clientRequestsRepository.query(`
        SELECT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            JSON_OBJECT(
                "name", U.name,
                "lastname", U.lastname,
                "phone", U.phone,
                "image", U.image
            ) AS client,
            JSON_OBJECT(
                "name", D.name,
                "lastname", D.lastname,
                "phone", D.phone,
                "image", D.image
            ) AS driver,
            JSON_OBJECT(
                "brand", DCI.brand,
                "plate", DCI.plate,
                "color", DCI.color
            ) AS car
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            driver_car_info AS DCI
        ON
            DCI.id_driver = CR.id_driver_assigned
        WHERE
            CR.id = ${id_client_request} AND CR.status = '${Status.CREATED}'
        `);
        return {
            ...data[0],
            'pickup_lat': data[0].pickup_position.y,
            'pickup_lng': data[0].pickup_position.x,
            'destination_lat': data[0].destination_position.y,
            'destination_lng': data[0].destination_position.x,
        };
    }

    async getByDriverAssigned(id_driver: number) {
        console.log('🔍 Buscando histórico de viagens para motorista ID:', id_driver);
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            JSON_OBJECT(
                "name", U.name,
                "lastname", U.lastname,
                "phone", U.phone,
                "image", U.image
            ) AS client,
            JSON_OBJECT(
                "name", D.name,
                "lastname", D.lastname,
                "phone", D.phone,
                "image", D.image
            ) AS driver,
            JSON_OBJECT(
                "brand", COALESCE(DCI.brand, ''),
                "licensePlate", COALESCE(DCI.licensePlate, ''),
                "color", COALESCE(DCI.color, '')
            ) AS vehicle
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            (SELECT id_user, ANY_VALUE(brand) AS brand, ANY_VALUE(licensePlate) AS licensePlate, ANY_VALUE(color) AS color 
             FROM vehicles 
             GROUP BY id_user) AS DCI
        ON
            DCI.id_user = CR.id_driver_assigned
        WHERE
            CR.id_driver_assigned = ${id_driver} AND CR.status = '${Status.FINISHED}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);
        return data;
    }

    async getByClientAssigned(id_client: number) {
        console.log('🔍 Buscando histórico de viagens para cliente ID:', id_client);
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver,
            JSON_OBJECT(
                "brand", COALESCE(DCI.brand, ''),
                "licensePlate", COALESCE(DCI.licensePlate, ''),
                "color", COALESCE(DCI.color, '')
            ) AS vehicle
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            (SELECT id_user, ANY_VALUE(brand) AS brand, ANY_VALUE(licensePlate) AS licensePlate, ANY_VALUE(color) AS color 
             FROM vehicles 
             GROUP BY id_user) AS DCI
        ON
            DCI.id_user = CR.id_driver_assigned
        WHERE
            CR.id_client = ${id_client} AND CR.status = '${Status.FINISHED}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        console.log('Histórico do cliente ID', id_client, ':', data);
        return data;
    }

    // =========================================================
    // ============== OBTÉM SOLICITAÇÕES PRÓXIMAS ==============
    // =========================================================
    async getNearbyTripRequest(driver_lat: number, driver_lng: number, id_driver: number, vehicle_type: string) {
        const data = await this.clientRequestsRepository.query(`
        SELECT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.pickup_position,
            CR.destination_position,
            ST_Distance_Sphere(pickup_position, ST_GeomFromText('POINT(${driver_lat} ${driver_lng})', 4326)) AS distance,
            timestampdiff(MINUTE, CR.updated_at, NOW()) AS time_difference,
            CR.vehicle_type,
            CR.clientRequestType,
            CR.distance_text,
            CR.distance_value,
            CR.duration_text,
            CR.duration_value,
            CR.recommended_value,
            CR.km_value,
            CR.min_value,
            CR.scheduledFor,
            CR.tolerance_minutes,

        JSON_OBJECT(
            "name", U.name,
            "lastname", U.lastname,
            "phone", U.phone,
            "image", U.image,
            "general_client_rating", U.general_client_rating
        ) AS client
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        WHERE
            timestampdiff(MINUTE, CR.updated_at, NOW()) < 5000 AND CR.status = '${Status.CREATED}'
            AND CR.id_client != ${id_driver} AND CR.vehicle_type = '${vehicle_type}'
        HAVING
            distance < 20000
        ORDER BY
            CR.id DESC
        `);
        if (data.length > 0) {
            const pickup_positions = data.map(d => ({
                lat: d.pickup_position.y,
                lng: d.pickup_position.x
            }));

            const googleResponse = await this.distancematrix({
                params: {
                    mode: TravelMode.driving,
                    key: API_KEY,
                    origins: [
                        {
                            lat: driver_lat,
                            lng: driver_lng
                        }
                    ],
                    destinations: pickup_positions
                }
            });

            data.forEach((d, index) => {
                d.google_distance_matrix = googleResponse.data.rows[0].elements[index];
            });
        }
        return data;
    }

    async getTimeAndDistanceClientRequest(
        origin_lat: number,
        origin_lng: number,
        destination_lat: number,
        destination_lng: number,
        type_vehicle: boolean | string
    ) {
        // Converte para boolean (pode vir como string "true"/"false" da URL)
        const isCarType = type_vehicle === true || type_vehicle === 'true' || type_vehicle === '1';

        console.log('Type Vehicle (original):', type_vehicle);
        console.log('Type Vehicle (type):', typeof type_vehicle);
        console.log('Is Car Type:', isCarType);

        const values = await this.timeAndDistanceValuesService.find();

        console.log('VALUES:', values);

        const kmValue = isCarType ? values[0].km_value : values[0].km_value_motorcycle;
        const minValue = isCarType ? values[0].min_value : values[0].min_value_motorcycle;

        console.log('KM VALUE:', kmValue);
        console.log('MIN VALUE:', minValue);

        const googleResponse = await this.distancematrix({
            params: {
                mode: TravelMode.driving,
                key: API_KEY,
                origins: [
                    {
                        lat: origin_lat,
                        lng: origin_lng
                    }
                ],
                destinations: [
                    {
                        lat: destination_lat,
                        lng: destination_lng
                    }
                ]
            }
        });

        const recommendedValue = (kmValue * (googleResponse.data.rows[0].elements[0].distance.value / 1000)) + (minValue * (googleResponse.data.rows[0].elements[0].duration.value / 60))

        return {
            'recommended_value': recommendedValue,
            'destination_addresses': googleResponse.data.destination_addresses[0],
            'origin_addresses': googleResponse.data.origin_addresses[0],
            'distance': {
                'text': googleResponse.data.rows[0].elements[0].distance.text,
                'value': (googleResponse.data.rows[0].elements[0].distance.value / 1000)
            },
            'duration': {
                'text': googleResponse.data.rows[0].elements[0].duration.text,
                'value': (googleResponse.data.rows[0].elements[0].duration.value / 60)
            },
            'km_value': kmValue,
            'min_value': minValue
        };
    }


    async getActiveByClient(id_client: number) {
        console.log('🔍 Buscando solicitação ativa para cliente ID:', id_client);

        const data = await this.clientRequestsRepository.query(`
        SELECT
            id,
            id_client,
            id_driver_assigned,
            status,
            pickup_description,
            destination_description,
            fare_offered,
            fare_assigned,
            created_at,
            updated_at
        FROM 
            client_requests
        WHERE
            id_client = ${id_client} AND status = '${Status.ACCEPTED}'
        ORDER BY
            created_at DESC
        LIMIT 1
        `);

        console.log('📊 Resultado da query:', data);
        console.log('📊 Quantidade de registros:', data.length);

        if (data && data.length > 0 && data[0]) {
            const result = {
                id: data[0].id,
                id_client: data[0].id_client,
                id_driver_assigned: data[0].id_driver_assigned,
                status: data[0].status,
                pickup_description: data[0].pickup_description,
                destination_description: data[0].destination_description,
                fare_offered: data[0].fare_offered,
                fare_assigned: data[0].fare_assigned,
                created_at: data[0].created_at,
                updated_at: data[0].updated_at
            };
            console.log('✅ Retornando objeto:', result);
            return result;
        }

        console.log('❌ Nenhum registro encontrado, retornando null');
        return null;
    }

    async getActiveByDriver(id_driver: number) {
        console.log('🔍 Buscando solicitação ativa para motorista ID:', id_driver);

        const data = await this.clientRequestsRepository.query(`
        SELECT
            id,
            id_client,
            id_driver_assigned,
            status,
            pickup_description,
            destination_description,
            fare_offered,
            fare_assigned,
            created_at,
            updated_at
        FROM 
            client_requests
        WHERE
            id_driver_assigned = ${id_driver} AND status = '${Status.ACCEPTED}'
        ORDER BY
            created_at DESC
        LIMIT 1
        `);

        console.log('📊 Resultado da query:', data);
        console.log('📊 Quantidade de registros:', data.length);

        if (data && data.length > 0 && data[0]) {
            const result = {
                id: data[0].id,
                id_client: data[0].id_client,
                id_driver_assigned: data[0].id_driver_assigned,
                status: data[0].status,
                pickup_description: data[0].pickup_description,
                destination_description: data[0].destination_description,
                fare_offered: data[0].fare_offered,
                fare_assigned: data[0].fare_assigned,
                created_at: data[0].created_at,
                updated_at: data[0].updated_at
            };
            console.log('✅ Retornando objeto:', result);
            return result;
        }

        console.log('❌ Nenhum registro encontrado, retornando null');
        return null;
    }

    async getByIdAndExpiredStatus(id: number) {
        console.log('🔍 Buscando solicitação expirada para ID:', id);

        const data = await this.clientRequestsRepository.query(`
        SELECT
            CR.id,
            CR.id_client,
            CR.id_driver_assigned,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.driver_rating,
            CR.client_rating,
            JSON_OBJECT(
                "name", U.name,
                "lastname", U.lastname,
                "phone", U.phone,
                "image", U.image
            ) AS client,
            JSON_OBJECT(
                "name", D.name,
                "lastname", D.lastname,
                "phone", D.phone,
                "image", D.image
            ) AS driver
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        WHERE
            CR.id = ${id} AND CR.status = '${Status.EXPIRED}'
        `);

        console.log('📊 Resultado da query para registro expirado:', data);
        console.log('📊 Quantidade de registros:', data.length);

        if (data && data.length > 0 && data[0]) {
            const result = {
                ...data[0],
                'pickup_lat': data[0].pickup_position?.y || null,
                'pickup_lng': data[0].pickup_position?.x || null,
                'destination_lat': data[0].destination_position?.y || null,
                'destination_lng': data[0].destination_position?.x || null,
            };
            console.log('✅ Retornando registro expirado:', result);
            return result;
        }

        console.log('❌ Nenhum registro expirado encontrado, retornando null');
        return null;
    }

    async getCreatedScheduleByClient(id_client: number) {
        console.log('🔍 Buscando histórico de viagens para cliente ID:', id_client);
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            DATE_FORMAT(CR.scheduledFor, '%Y-%m-%dT%H:%i:%s.000Z') AS scheduledFor,
            CR.pickup_description_plus,
            CR.destination_description_plus,
            CR.tolerance_minutes,
            CR.vehicle_type,
            CR.driver_rating,
            CR.client_rating,
            CR.driver_report,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        WHERE
            CR.id_client = ${id_client} AND (CR.status = '${Status.CREATED}' OR CR.status = '${Status.ACCEPTED}' OR CR.status = '${Status.FINISHED}' OR CR.status = '${Status.CANCELLED}') AND CR.clientRequestType = '${ClientRequestType.SCHEDULED}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        console.log('Histórico do cliente ID', id_client, ':', data);
        return data;
    }

    async getCreatedScheduleByDriver(id_driver: number) {
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            DATE_FORMAT(CR.scheduledFor, '%Y-%m-%dT%H:%i:%s.000Z') AS scheduledFor,
            CR.pickup_description_plus,
            CR.destination_description_plus,
            CR.tolerance_minutes,
            CR.vehicle_type,
            CR.client_report,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        WHERE
            CR.id_driver_assigned = ${id_driver} AND (CR.status = '${Status.CREATED}' OR CR.status = '${Status.ACCEPTED}' OR CR.status = '${Status.FINISHED}' OR CR.status = '${Status.CANCELLED}') AND CR.clientRequestType = '${ClientRequestType.SCHEDULED}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        return data;
    }

    async getCreatedCommonByDriver(id_driver: number) {
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            DATE_FORMAT(CR.scheduledFor, '%Y-%m-%dT%H:%i:%s.000Z') AS scheduledFor,
            CR.pickup_description_plus,
            CR.destination_description_plus,
            CR.tolerance_minutes,
            CR.vehicle_type,
            CR.client_report,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        WHERE
            CR.id_driver_assigned = ${id_driver} 
                AND (CR.status = '${Status.CREATED}' 
                OR CR.status = '${Status.ACCEPTED}' 
                OR CR.status = '${Status.FINISHED}' 
                OR CR.status = '${Status.CANCELLED}') 
                AND CR.clientRequestType = '${ClientRequestType.COMMON}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        return data;
    }

    async checkIfFinishedOrCancelled(id: number): Promise<{ id: number } | null> {
        console.log('🔍 Verificando se solicitação ID:', id, 'está FINISHED ou CANCELLED');

        const data = await this.clientRequestsRepository.query(`
        SELECT
            id
        FROM 
            client_requests
        WHERE
            id = ${id} AND (status = '${Status.FINISHED}' OR status = '${Status.CANCELLED}')
        LIMIT 1
        `);

        if (data && data.length > 0) {
            console.log('✅ Solicitação encontrada com status FINISHED ou CANCELLED');
            return { id: data[0].id };
        }

        console.log('❌ Solicitação não encontrada ou não está FINISHED/CANCELLED');
        return null;
    }

    async getByClientCommonAssigned(id_client: number) {
        console.log('🔍 Buscando histórico de viagens para cliente ID:', id_client);
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver,
            JSON_OBJECT(
                "brand", COALESCE(DCI.brand, ''),
                "licensePlate", COALESCE(DCI.licensePlate, ''),
                "color", COALESCE(DCI.color, '')
            ) AS vehicle
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            (SELECT id_user, ANY_VALUE(brand) AS brand, ANY_VALUE(licensePlate) AS licensePlate, ANY_VALUE(color) AS color 
             FROM vehicles 
             GROUP BY id_user) AS DCI
        ON
            DCI.id_user = CR.id_driver_assigned
        WHERE
            CR.id_client = ${id_client} 
                AND (CR.status = '${Status.CREATED}' 
                OR CR.status = '${Status.ACCEPTED}' 
                OR CR.status = '${Status.FINISHED}' 
                OR CR.status = '${Status.CANCELLED}') 
                AND CR.clientRequestType = '${ClientRequestType.COMMON}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        console.log('Histórico do cliente ID', id_client, ':', data);
        return data;
    }

    async getByClientDeliveryAssigned(id_client: number) {
        console.log('🔍 Buscando histórico de viagens para cliente ID:', id_client);
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            CR.code,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver,
            JSON_OBJECT(
                "brand", COALESCE(DCI.brand, ''),
                "licensePlate", COALESCE(DCI.licensePlate, ''),
                "color", COALESCE(DCI.color, '')
            ) AS vehicle
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            (SELECT id_user, ANY_VALUE(brand) AS brand, ANY_VALUE(licensePlate) AS licensePlate, ANY_VALUE(color) AS color 
             FROM vehicles 
             GROUP BY id_user) AS DCI
        ON
            DCI.id_user = CR.id_driver_assigned
        WHERE
            CR.id_client = ${id_client} 
                AND (CR.status = '${Status.CREATED}' 
                OR CR.status = '${Status.ACCEPTED}' 
                OR CR.status = '${Status.FINISHED}' 
                OR CR.status = '${Status.CANCELLED}') 
                AND CR.clientRequestType = '${ClientRequestType.DELIVERY}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        console.log('Histórico do cliente ID', id_client, ':', data);
        return data;
    }
    
    async getByClientScheduledAssigned(id_client: number) {
        console.log('🔍 Buscando histórico de viagens para cliente ID:', id_client);
        const data = await this.clientRequestsRepository.query(`
        SELECT DISTINCT
            CR.id,
            CR.id_client,
            CR.fare_offered,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.created_at,
            CR.pickup_position,
            CR.destination_position,
            CR.fare_assigned,
            CR.id_driver_assigned,
            CR.driver_rating,
            CR.client_rating,
            JSON_OBJECT(
                "name", COALESCE(U.name, ''),
                "lastname", COALESCE(U.lastname, ''),
                "phone", COALESCE(U.phone, ''),
                "image", COALESCE(U.image, '')
            ) AS client,
            JSON_OBJECT(
                "name", COALESCE(D.name, ''),
                "lastname", COALESCE(D.lastname, ''),
                "phone", COALESCE(D.phone, ''),
                "image", COALESCE(D.image, '')
            ) AS driver,
            JSON_OBJECT(
                "brand", COALESCE(DCI.brand, ''),
                "licensePlate", COALESCE(DCI.licensePlate, ''),
                "color", COALESCE(DCI.color, '')
            ) AS vehicle
        FROM 
            client_requests AS CR
        INNER JOIN
            users AS U
        ON
            U.id = CR.id_client
        LEFT JOIN
            users AS D
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            (SELECT id_user, ANY_VALUE(brand) AS brand, ANY_VALUE(licensePlate) AS licensePlate, ANY_VALUE(color) AS color 
             FROM vehicles 
             GROUP BY id_user) AS DCI
        ON
            DCI.id_user = CR.id_driver_assigned
        WHERE
            CR.id_client = ${id_client} 
                AND (CR.status = '${Status.CREATED}' 
                OR CR.status = '${Status.ACCEPTED}' 
                OR CR.status = '${Status.FINISHED}' 
                OR CR.status = '${Status.CANCELLED}') 
                AND CR.clientRequestType = '${ClientRequestType.SCHEDULED}'
        ORDER BY
            CR.id DESC
        LIMIT 10
        `);

        console.log('Histórico do cliente ID', id_client, ':', data);
        return data;
    }
}
