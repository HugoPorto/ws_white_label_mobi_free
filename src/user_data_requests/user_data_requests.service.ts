import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDataRequests } from './user_data_requests.entity';
import { CreateUserDataRequestsDto } from './dto/create-user_data_requests.dto';

@Injectable()
export class UserDataRequestsService {
    
    constructor(
        @InjectRepository(UserDataRequests) private userDataRequestsRepository: Repository<UserDataRequests>,
    ) { }

    async create(createUserDataRequestsDto: CreateUserDataRequestsDto) {
        try {
            const newRequest = this.userDataRequestsRepository.create({
                user: { id: createUserDataRequestsDto.id_user } as any,
                status: createUserDataRequestsDto.status || false,
                type: createUserDataRequestsDto.type || 'information'
            });
            
            return await this.userDataRequestsRepository.save(newRequest);
        } catch (error) {
            throw new HttpException(
                'Erro ao criar solicitação de exportação de dados', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
