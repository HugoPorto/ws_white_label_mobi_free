import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository, In } from 'typeorm';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '../roles/rol.entity';
import { Veh } from 'src/vehicles/veh.entity';
import { randomUUID } from 'crypto';
import { UserSession } from 'src/user_sessions/user_sessions.entity';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Rol) private rolesRepository: Repository<Rol>,
        @InjectRepository(Veh) private vehiclesRepository: Repository<Veh>,
        @InjectRepository(UserSession) private userSessionRepository: Repository<UserSession>,

        private jwtService: JwtService
    ) { }

    async register(user: RegisterAuthDto) {
        const { email, phone } = user;

        const emailExist = await this.usersRepository.findOneBy({ email: email })

        if (emailExist) {
            throw new HttpException('O E-MAIL JÁ ESTÁ REGISTRADO', HttpStatus.CONFLICT);
        }

        const phoneExist = await this.usersRepository.findOneBy({ phone: phone });

        if (phoneExist) {
            throw new HttpException('O TELEFONE JÁ ESTÁ REGISTRADO', HttpStatus.CONFLICT)
        }

        const newUser = this.usersRepository.create(user);

        if (user.car === undefined) {
            newUser.car = null;
        } else {
            newUser.car = !user.car;
        }

        let rolesIds = [];

        if (Array.isArray(user.rolesIds) && user.rolesIds.length > 0) {
            rolesIds = user.rolesIds;
        } else if (
            typeof user.rolesIds === 'string' &&
            user.rolesIds &&
            typeof (user.rolesIds as string).trim === 'function' &&
            (user.rolesIds as string).trim() !== ''
        ) {
            rolesIds = [(user.rolesIds as string).trim()];
        } else {
            rolesIds = ['CLIENT'];
        }

        if (rolesIds.length > 1) {
            rolesIds.forEach(async element => {
                const role = await this.rolesRepository.findOneBy({ id: element });
                if (!role) {
                    throw new HttpException('UM DOS PAPÉIS INFORMADOS NÃO EXISTE', HttpStatus.BAD_REQUEST);
                }
            });

        }

        const roles = await this.rolesRepository.findBy({ id: In(rolesIds) });

        newUser.roles = roles;

        const userSaved = await this.usersRepository.save(newUser);

        const rolesString = userSaved.roles.map(rol => rol.id);

        const payload = { id: userSaved.id, name: userSaved.name, roles: rolesString };

        const token = this.jwtService.sign(payload);

        const data = {
            user: userSaved,
            token: 'Bearer ' + token
        }

        delete data.user.password;

        return data;
    }

    async login(loginData: LoginAuthDto) {
        const { email, password, device_id } = loginData;

        console.log('Device ID no login:', device_id);

        const userFound = await this.usersRepository.findOne({
            where: { email: email },
            relations: ['roles']
        })

        if (!userFound) {
            throw new HttpException('O E-MAIL NÃO EXISTE', HttpStatus.NOT_FOUND);
        }

        const isPasswordValid = await compare(password, userFound.password);

        if (!isPasswordValid) {
            throw new HttpException('A SENHA ESTÁ INCORRETA', HttpStatus.FORBIDDEN);
        }

        // 🔴 INVALIDA SESSÕES ANTERIORES DO MESMO USUÁRIO
        await this.userSessionRepository.update(
            { user: { id: userFound.id }, is_active: true },
            { is_active: false }
        );

        const rolesIds = userFound.roles.map(rol => rol.id);

        const vehicles = await this.vehiclesRepository.find({
            where: { user: { id: userFound.id } }
        });

        const payload = {
            id: userFound.id,
            name: userFound.name,
            roles: rolesIds
        };

        const token = this.jwtService.sign(payload, {
            expiresIn: '2d'
        });

        const refreshToken = randomUUID();
        const refreshTokenHash = await hash(refreshToken, 10);

        // 🟢 CRIA NOVA SESSÃO ATIVA
        const newSession = this.userSessionRepository.create({
            device_id: device_id || null,
            refresh_token_hash: refreshTokenHash,
            access_token: token,
            is_active: true
        });

        newSession.user = userFound;

        await this.userSessionRepository.save(newSession);

        console.log('✅ Nova sessão criada:', {
            userId: userFound.id,
            deviceId: device_id,
            sessionId: newSession.id,
            createdAt: newSession.created_at
        });

        const data = {
            user: userFound,
            vehicles: vehicles,
            token: 'Bearer ' + token,
            refresh_token: refreshTokenHash,
            session_id: newSession.id
        }

        delete data.user.password;

        return data;
    }

    async refresh(refreshToken: string) {
        console.log('🔄 Tentando renovar token com refresh_token...');

        const session = await this.userSessionRepository.findOne({
            where: {
                refresh_token_hash: refreshToken,
                is_active: true
            },
            relations: ['user', 'user.roles']
        });

        if (!session) {
            console.log('❌ Sessão não encontrada ou inativa');
            throw new HttpException('Sessão inválida ou expirada', HttpStatus.UNAUTHORIZED);
        }

        console.log('✅ Sessão encontrada:', {
            sessionId: session.id,
            userId: session.user.id,
            deviceId: session.device_id
        });

        const rolesIds = session.user.roles.map(rol => rol.id);

        const payload = {
            id: session.user.id,
            name: session.user.name,
            roles: rolesIds
        };

        const newAccessToken = this.jwtService.sign(payload, {
            expiresIn: '2d'
        });

        // Atualiza last_activity e access_token da sessão
        await this.userSessionRepository.update(
            { id: session.id },
            {
                last_activity: new Date(),
                access_token: 'Bearer ' + newAccessToken
            }
        );

        console.log('✅ Token renovado com sucesso para usuário:', session.user.id);

        const vehicles = await this.vehiclesRepository.find({
            where: { user: { id: session.user.id } }
        });

        const data = {
            user: session.user,
            vehicles: vehicles,
            token: 'Bearer ' + newAccessToken,
            refresh_token: session.refresh_token_hash,
            session_id: session.id
        };

        delete data.user.password;

        return data;
    }

    async checkSession(session_id: string) {
        try {
            if (session_id) {
                console.log('🔐 Verificando sessão:', session_id);
                const session = await this.userSessionRepository.findOne({
                    where: { id: session_id }
                });

                console.log('Session encontrada:', session);

                if (!session) {
                    console.log('❌ Sessão não encontrada');
                    throw new HttpException('Sessão não encontrada', HttpStatus.UNAUTHORIZED);
                }

                if (!session.is_active) {
                    console.log('❌ Sessão inativa - requer logout');
                    throw new HttpException('Sessão inválida - faça login novamente', HttpStatus.UNAUTHORIZED);
                }

                console.log('✅ Sessão válida e ativa');
                return { valid: true, message: 'Sessão válida e ativa' };
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Erro ao buscar documentos do usuário',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
