import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'bcrypt';
import storage = require('../utils/cloud_storage');
import { UpdateStatusUserDto } from './dto/update-status-user.dto';
import { UpdatePhoneVerifiedUserDto } from './dto/update-phone-verified-user.dto';
import { Veh } from '../vehicles/veh.entity';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Veh) private vehiclesRepository: Repository<Veh>,
        private twilioService: TwilioService,
    ) { }

    create(user: CreateUserDto) {
        const newUser = this.usersRepository.create(user);
        return this.usersRepository.save(newUser);
    }

    findAllBkt0() {
        return this.usersRepository.find({ relations: ['roles'] });
    }

    findAllBkt1() {
        return this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .where('role.id != :adminRole OR role.id IS NULL', { adminRole: 'ADMIN' })
            .getMany();
    }

    findAllBkt2() {
        return this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .where(qb => {
                const subQuery = qb.subQuery()
                    .select('userSub.id')
                    .from(User, 'userSub')
                    .leftJoin('userSub.roles', 'roleSub')
                    .where('roleSub.id = :adminRole', { adminRole: 'ADMIN' })
                    .getQuery();
                return 'user.id NOT IN ' + subQuery;
            })
            .getMany();
    }

    findAllBkt3() {
        return this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoin(
                'client_requests',
                'rides_as_driver',
                'rides_as_driver.id_driver_assigned = user.id AND rides_as_driver.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .leftJoin(
                'client_requests',
                'rides_as_client',
                'rides_as_client.id_client = user.id AND rides_as_client.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .addSelect('COUNT(DISTINCT rides_as_driver.id)', 'finished_rides_as_driver')
            .addSelect('COUNT(DISTINCT rides_as_client.id)', 'finished_rides_as_client')
            .where(qb => {
                const subQuery = qb.subQuery()
                    .select('userSub.id')
                    .from(User, 'userSub')
                    .leftJoin('userSub.roles', 'roleSub')
                    .where('roleSub.id = :adminRole', { adminRole: 'ADMIN' })
                    .getQuery();
                return 'user.id NOT IN ' + subQuery;
            })
            .groupBy('user.id')
            .addGroupBy('role.id')
            .getRawAndEntities()
            .then(result => {
                return result.entities.map((user, index) => ({
                    ...user,
                    finished_rides_as_driver: parseInt(result.raw[index]?.finished_rides_as_driver || '0'),
                    finished_rides_as_client: parseInt(result.raw[index]?.finished_rides_as_client || '0'),
                    total_finished_rides: parseInt(result.raw[index]?.finished_rides_as_driver || '0') + parseInt(result.raw[index]?.finished_rides_as_client || '0')
                }));
            });
    }

    findAllBkt4() {
        return this.usersRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.name',
                'user.lastname',
                'user.email',
                'user.phone',
                'user.image',
                'user.notification_token',
                'user.cpf',
                'user.car',
                'user.phone_verified',
                'user.active',
                'user.created_at',
                'user.updated_at'
            ])
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoin(
                'client_requests',
                'rides_as_driver',
                'rides_as_driver.id_driver_assigned = user.id AND rides_as_driver.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .leftJoin(
                'client_requests',
                'rides_as_client',
                'rides_as_client.id_client = user.id AND rides_as_client.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .addSelect('COUNT(DISTINCT rides_as_driver.id)', 'finished_rides_as_driver')
            .addSelect('COUNT(DISTINCT rides_as_client.id)', 'finished_rides_as_client')
            .where(qb => {
                const subQuery = qb.subQuery()
                    .select('userSub.id')
                    .from(User, 'userSub')
                    .leftJoin('userSub.roles', 'roleSub')
                    .where('roleSub.id = :adminRole', { adminRole: 'ADMIN' })
                    .getQuery();
                return 'user.id NOT IN ' + subQuery;
            })
            .groupBy('user.id')
            .addGroupBy('role.id')
            .getRawAndEntities()
            .then(result => {
                return result.entities.map((user, index) => ({
                    ...user,
                    finished_rides_as_driver: parseInt(result.raw[index]?.finished_rides_as_driver || '0'),
                    finished_rides_as_client: parseInt(result.raw[index]?.finished_rides_as_client || '0'),
                    total_finished_rides: parseInt(result.raw[index]?.finished_rides_as_driver || '0') + parseInt(result.raw[index]?.finished_rides_as_client || '0')
                }));
            });
    }

    findAllBkt5() {
        return this.usersRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.name',
                'user.lastname',
                'user.email',
                'user.phone',
                'user.image',
                'user.notification_token',
                'user.cpf',
                'user.car',
                'user.phone_verified',
                'user.active',
                'user.created_at',
                'user.updated_at'
            ])
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('user.balance', 'balance')
            .leftJoin(
                'client_requests',
                'rides_as_driver',
                'rides_as_driver.id_driver_assigned = user.id AND rides_as_driver.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .leftJoin(
                'client_requests',
                'rides_as_client',
                'rides_as_client.id_client = user.id AND rides_as_client.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .addSelect('COUNT(DISTINCT rides_as_driver.id)', 'finished_rides_as_driver')
            .addSelect('COUNT(DISTINCT rides_as_client.id)', 'finished_rides_as_client')
            .where(qb => {
                const subQuery = qb.subQuery()
                    .select('userSub.id')
                    .from(User, 'userSub')
                    .leftJoin('userSub.roles', 'roleSub')
                    .where('roleSub.id = :adminRole', { adminRole: 'ADMIN' })
                    .getQuery();
                return 'user.id NOT IN ' + subQuery;
            })
            .groupBy('user.id')
            .addGroupBy('role.id')
            .addGroupBy('balance.id')
            .getRawAndEntities()
            .then(result => {
                return result.entities.map((user, index) => ({
                    ...user,
                    finished_rides_as_driver: parseInt(result.raw[index]?.finished_rides_as_driver || '0'),
                    finished_rides_as_client: parseInt(result.raw[index]?.finished_rides_as_client || '0'),
                    total_finished_rides: parseInt(result.raw[index]?.finished_rides_as_driver || '0') + parseInt(result.raw[index]?.finished_rides_as_client || '0')
                }));
            });
    }

    async findAll() {
        const result = await this.usersRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.name',
                'user.lastname',
                'user.email',
                'user.phone',
                'user.image',
                'user.notification_token',
                'user.cpf',
                'user.car',
                'user.phone_verified',
                'user.active',
                'user.created_at',
                'user.updated_at'
            ])
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('user.balance', 'balance')
            .leftJoin(
                'client_requests',
                'rides_as_driver',
                'rides_as_driver.id_driver_assigned = user.id AND rides_as_driver.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .leftJoin(
                'client_requests',
                'rides_as_client',
                'rides_as_client.id_client = user.id AND rides_as_client.status = :finishedStatus',
                { finishedStatus: 'FINISHED' }
            )
            .addSelect('COUNT(DISTINCT rides_as_driver.id)', 'finished_rides_as_driver')
            .addSelect('COUNT(DISTINCT rides_as_client.id)', 'finished_rides_as_client')
            .where(qb => {
                const subQuery = qb.subQuery()
                    .select('userSub.id')
                    .from(User, 'userSub')
                    .leftJoin('userSub.roles', 'roleSub')
                    .where('roleSub.id = :adminRole', { adminRole: 'ADMIN' })
                    .getQuery();
                return 'user.id NOT IN ' + subQuery;
            })
            .groupBy('user.id')
            .addGroupBy('role.id')
            .addGroupBy('balance.id')
            .getRawAndEntities();

        // Para cada usuário, buscar seus veículos
        const usersWithVehicles = await Promise.all(
            result.entities.map(async (user, index) => {
                const vehicles = await this.vehiclesRepository.find({
                    where: { user: { id: user.id } }
                });

                return {
                    ...user,
                    finished_rides_as_driver: parseInt(result.raw[index]?.finished_rides_as_driver || '0'),
                    finished_rides_as_client: parseInt(result.raw[index]?.finished_rides_as_client || '0'),
                    total_finished_rides: parseInt(result.raw[index]?.finished_rides_as_driver || '0') + parseInt(result.raw[index]?.finished_rides_as_client || '0'),
                    vehicles: vehicles
                };
            })
        );

        return usersWithVehicles;
    }

    async findById(id: number) {
        const user = await this.usersRepository.findOne({
            where: { id: id },
            relations: ['roles'],
            select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
                phone: true,
                image: true,
                notification_token: true,
                cpf: true,
                car: true,
                phone_verified: true,
                created_at: true,
                updated_at: true,
                roles: true
            }
        });

        if (!user) {
            throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
        }

        return user;
    }

    async update(id: number, user: UpdateUserDto) {
        const userFound = await this.usersRepository.findOneBy({ id: id });

        if (!userFound) {
            throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
        }

        if (user.password) {
            user.password = await hash(user.password, Number(process.env.HASH_SALT));
        }

        const updatedUser = Object.assign(userFound, user);
        return this.usersRepository.save(updatedUser);
    }

    async updateAndSendPassword(
        email: string,
        phoneNumber: string,
    ) {

        console.log('Recover Password called with email:', email, 'and phoneNumber:', phoneNumber);

        // Remover o +55 do número de telefone para buscar no banco
        const phoneForDatabase = phoneNumber.replace(/^\+55/, '');
        
        console.log('Phone for database search:', phoneForDatabase);
        
        const userFound = await this.usersRepository.findOne({
            where: { 
                email: email,
                phone: phoneForDatabase 
            }
        });

        if (!userFound) {
            throw new HttpException(
                'Usuário não encontrado com o email e telefone fornecidos', 
                HttpStatus.NOT_FOUND
            );
        }

        // Gerar senha aleatória de 8 caracteres (letras e números)
        const randomPassword = this.generateRandomPassword(8);

        console.log('Generated Password:', randomPassword);

        // Hash da nova senha
        const hashedPassword = await hash(randomPassword, Number(process.env.HASH_SALT));

        // Atualizar senha do usuário
        userFound.password = hashedPassword;
        await this.usersRepository.save(userFound);

        // Enviar SMS com a nova senha (usar o número original com +55 para o Twilio)
        try {
            await this.twilioService.sendSms(
                phoneNumber,
                `Sua nova senha do White Label App Mobi Free é: ${randomPassword}\n\nPor segurança, altere sua senha após fazer login.`
            );
        } catch (error) {
            console.error('Erro ao enviar SMS:', error);
            throw new HttpException(
                'Senha atualizada, mas houve um erro ao enviar o SMS. Contate o suporte.',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        return {
            message: 'Nova senha enviada com sucesso para o telefone cadastrado',
            success: true
        };
    }

    /**
     * Gera uma senha aleatória com letras maiúsculas, minúsculas e números
     */
    private generateRandomPassword(length: number): string {
        const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const allChars = upperChars + lowerChars + numbers;
        
        let password = '';
        
        // Garantir pelo menos 1 maiúscula, 1 minúscula e 1 número
        password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
        password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        
        // Completar o restante da senha
        for (let i = password.length; i < length; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        // Embaralhar a senha para não ter sempre o padrão maiúscula-minúscula-número no início
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    async updateStatus(id: number, user: UpdateStatusUserDto) {
        const userFound = await this.usersRepository.findOneBy({ id: id });

        if (!userFound) {
            throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
        }

        const updatedUser = Object.assign(userFound, user);

        return this.usersRepository.save(updatedUser);
    }

    async updatePhoneVerified(id: number, user: UpdatePhoneVerifiedUserDto) {
        const userFound = await this.usersRepository.findOneBy({ id: id });

        if (!userFound) {
            throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
        }

        const updatedUser = Object.assign(userFound, user);

        return this.usersRepository.save(updatedUser);
    }

    async updateWithImage(file: Express.Multer.File, id: number, user: UpdateUserDto) {
        const url = await storage(file, file.originalname);
        console.log('URL: ' + url);

        if (url === undefined && url === null) {
            throw new HttpException('Não foi possível salvar a imagem', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const userFound = await this.usersRepository.findOneBy({ id: id });

        if (!userFound) {
            throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
        }

        user.image = url;

        const updatedUser = Object.assign(userFound, user);

        return this.usersRepository.save(updatedUser);
    }
}
