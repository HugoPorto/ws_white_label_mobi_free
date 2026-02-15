import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rol } from './rol.entity';
import { Repository } from 'typeorm';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {

    constructor(@InjectRepository(Rol) private rolesRepository: Repository<Rol>) {}

    create(rol: CreateRolDto) {
        const newRol = this.rolesRepository.create(rol);
        return this.rolesRepository.save(newRol);
    }

    async update(id: string, updateRolDto: UpdateRolDto) {
        const rol = await this.rolesRepository.findOneBy({ id: id });

        if (!rol) {
            throw new HttpException('Role não encontrada', HttpStatus.NOT_FOUND);
        }

        const updatedRol = Object.assign(rol, updateRolDto);
        updatedRol.updated_at = new Date();
        
        return this.rolesRepository.save(updatedRol);
    }

}
