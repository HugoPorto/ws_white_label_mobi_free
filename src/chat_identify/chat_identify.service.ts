import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatIdentify } from './chat_identify.entity';
import { CreateChatIdentifyDto } from './dto/create-chat-identify.dto';
import { UpdateChatIdentifyDto } from './dto/update-chat-identify.dto';
import { User } from 'src/users/user.entity';

@Injectable()
export class ChatIdentifyService {
    constructor(
        @InjectRepository(ChatIdentify)
        private chatIdentifyRepository: Repository<ChatIdentify>,
    ) { }

    async create(createChatIdentifyDto: CreateChatIdentifyDto): Promise<ChatIdentify> {
        const { id_user, ...chatIdentifyData } = createChatIdentifyDto;
        const newChatIdentify = this.chatIdentifyRepository.create(chatIdentifyData);
        newChatIdentify.user = { id: id_user } as User;
        return this.chatIdentifyRepository.save(newChatIdentify);
    }

    async findAll(): Promise<ChatIdentify[]> {
        return this.chatIdentifyRepository.find({
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
    }

    async findOne(id: number): Promise<ChatIdentify> {
        const chatIdentify = await this.chatIdentifyRepository.findOne({
            where: { id },
            relations: ['user']
        });
        
        if (!chatIdentify) {
            throw new NotFoundException(`ChatIdentify com ID ${id} não encontrado`);
        }
        
        return chatIdentify;
    }

    async findByCode(code: string): Promise<ChatIdentify> {
        const chatIdentify = await this.chatIdentifyRepository.findOne({
            where: { code },
            relations: ['user']
        });
        
        if (!chatIdentify) {
            throw new NotFoundException(`ChatIdentify com código ${code} não encontrado`);
        }
        
        return chatIdentify;
    }

    async findByUser(id_user: number): Promise<ChatIdentify[]> {
        return this.chatIdentifyRepository.find({
            where: [
                { id_sender: id_user },
                { id_receiver: id_user }
            ],
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
    }

    async findByClientRequest(id_client_request: number): Promise<ChatIdentify[]> {
        return this.chatIdentifyRepository.find({
            where: { id_client_request },
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
    }

    async update(id: number, updateChatIdentifyDto: UpdateChatIdentifyDto): Promise<ChatIdentify> {
        const chatIdentify = await this.findOne(id);
        
        const { id_user, ...updateData } = updateChatIdentifyDto;
        
        if (id_user) {
            chatIdentify.user = { id: id_user } as User;
        }
        
        Object.assign(chatIdentify, updateData);
        
        return this.chatIdentifyRepository.save(chatIdentify);
    }

    async remove(id: number): Promise<void> {
        const chatIdentify = await this.findOne(id);
        await this.chatIdentifyRepository.remove(chatIdentify);
    }
}
