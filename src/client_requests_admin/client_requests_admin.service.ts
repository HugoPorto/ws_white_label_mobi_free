import { Client, DistanceMatrixResponseData, TravelMode } from '@googlemaps/google-maps-services-js';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientRequests } from '../client_requests/client_requests.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { TimeAndDistanceValuesService } from '../time_and_distance_values/time_and_distance_values.service';
import { FirebaseRepository } from 'src/firebase/firebase.repository';
import { CreateClientRequestDto } from './dto/create_client_request.dto';
import { Logger } from '@nestjs/common';


@Injectable()
export class ClientRequestsAdminService extends Client {
    private readonly API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    private readonly logger = new Logger(ClientRequestsAdminService.name);

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

            const data = await this.clientRequestsRepository.query(`SELECT MAX(id) AS id FROM client_requests`);

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

            return Number(data[0].id);
        } catch (error) {
            console.log('Error creando la solicitud del cliente', error);
            throw new HttpException('Error del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTimeAndDistanceClientRequest(
        origin_lat: number,
        origin_lng: number,
        destination_lat: number,
        destination_lng: number,
        type_vehicle: boolean | string
    ) {
        const isCarType = type_vehicle === true || type_vehicle === 'true' || type_vehicle === '1';

        const values = await this.timeAndDistanceValuesService.find();

        const kmValue = isCarType ? values[0].km_value : values[0].km_value_motorcycle;
        const minValue = isCarType ? values[0].min_value : values[0].min_value_motorcycle;

        const googleResponse = await this.distancematrix({
            params: {
                mode: TravelMode.driving,
                key: this.API_KEY,
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
}
