import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Balance } from './balance.entity';
import { Repository } from 'typeorm';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { User } from 'src/users/user.entity';
import { UpdateBalanceDto } from './dto/update-balance.dto';

@Injectable()
export class BalanceService {
    constructor(
        @InjectRepository(Balance) private balanceRepository: Repository<Balance>,
    ) { }

    async create(balance: CreateBalanceDto) {
        console.log('Creating balance:', balance);
        // Cria a instância do balance sem o campo user
        const { id_user, ...balanceData } = balance;
        const newBalance = this.balanceRepository.create(balanceData);
        // Associa o usuário ao balance
        newBalance.user = { id: id_user } as User;
        return this.balanceRepository.save(newBalance);
    }

    async updateCommon(id_user: number, balance: UpdateBalanceDto) {
        console.log('Updating balance by user ID:', id_user, balance);
        const existingBalance = await this.balanceRepository.findOne({
            where: { user: { id: id_user } },
            relations: ['user']
        });
        if (!existingBalance) {
            throw new Error('Balance not found for this user');
        }
        const updatedBalance = Object.assign(existingBalance, balance);

        if ('id_user' in balance) {
            throw new Error('id_user cannot be updated');
        }

        return this.balanceRepository.save(updatedBalance);
    }

    async update(id_user: number, balance: UpdateBalanceDto) {
        console.log('Updating balance by user ID:', id_user, balance);

        let existingBalance = await this.balanceRepository.findOne({
            where: { user: { id: id_user } },
            relations: ['user']
        });

        // Se não existir, criar um novo registro com valores zero
        if (!existingBalance) {
            console.log('Balance not found, creating new one with zero values');
            const newBalance = this.balanceRepository.create({
                balance_in: 0,
                balance_out: 0,
                user: { id: id_user } as User
            });
            existingBalance = await this.balanceRepository.save(newBalance);
        }

        // Adiciona o saldo ao valor existente ao invés de substituir
        if (balance.balance_out !== undefined) {
            existingBalance.balance_out = (existingBalance.balance_out || 0) + balance.balance_out;
        }

        if (balance.balance_in !== undefined) {
            existingBalance.balance_in = (existingBalance.balance_in || 0) + balance.balance_in;
        }

        // Atualiza outros campos se fornecidos (exceto balance_out e balance_in que já foram tratados)
        const { balance_out, balance_in, ...otherFields } = balance;
        Object.assign(existingBalance, otherFields);

        return this.balanceRepository.save(existingBalance);
    }

    findAll() {
        return this.balanceRepository.find();
    }

    async findByUserId(id_user: number) {
        return this.balanceRepository.findOne({
            where: { user: { id: id_user } },
            relations: ['user']
        });
    }
}
