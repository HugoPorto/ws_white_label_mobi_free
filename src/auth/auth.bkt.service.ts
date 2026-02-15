import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository, In } from 'typeorm';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '../roles/rol.entity';
import { Veh } from 'src/vehicles/veh.entity';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(Rol) private rolesRepository: Repository<Rol>,
        @InjectRepository(Veh) private vehiclesRepository: Repository<Veh>,

        private jwtService: JwtService
    ) { }

    async register(user: RegisterAuthDto) {
        console.log('USER DATA', user);

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

        // Inverte o valor do campo car antes de salvar no banco de dados
        console.log('CAR BEFORE SAVE:', user.car);
        
        if (user.car === undefined) {
            newUser.car = null;
        }else{
            newUser.car = !user.car;
        }

        let rolesIds = [];

        if (Array.isArray(user.rolesIds) && user.rolesIds.length > 0) {
            console.log('ROLES IDS', user.rolesIds);
            rolesIds = user.rolesIds;
        } else if (
            typeof user.rolesIds === 'string' &&
            user.rolesIds &&
            typeof (user.rolesIds as string).trim === 'function' &&
            (user.rolesIds as string).trim() !== ''
        ) {
            console.log('SINGLE ROLE ID', user.rolesIds);
            rolesIds = [(user.rolesIds as string).trim()];
        } else {
            console.log('NO ROLES IDS, DEFAULT TO CLIENTE');
            rolesIds = ['CLIENT'];
        }

        console.log('ROLES IDS', rolesIds);

        console.log('TAMANHO ROLES IDS', rolesIds.length);

        if( rolesIds.length > 1) {
            rolesIds.forEach(async element => {
                console.log('ROLE ID:', element);
                const role = await this.rolesRepository.findOneBy({ id: element });
                if (!role) {
                    throw new HttpException('Um dos papéis informados não existe', HttpStatus.BAD_REQUEST);
                }else{
                    console.log('ROLE EXISTE:', role);
                }
            });

        }

        const roles = await this.rolesRepository.findBy({ id: In(rolesIds) });

        console.log('ROLES - findBy', roles);

        newUser.roles = roles;

        console.log('NOVO USUÁRIO', newUser);

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

        const { email, password } = loginData;

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

        const rolesIds = userFound.roles.map(rol => rol.id);

        const vehicles = await this.vehiclesRepository.find({
            where: { user: { id: userFound.id } }
        });

        // console.log('VEHICLES', vehicles);

        const payload = {
            id: userFound.id,
            name: userFound.name,
            roles: rolesIds
        };

        const token = this.jwtService.sign(payload);

        const data = {
            user: userFound,
            vehicles: vehicles,
            token: 'Bearer ' + token
        }

        delete data.user.password;

        console.log('LOGIN RESPONSE', data);

        return data;
    }
}
