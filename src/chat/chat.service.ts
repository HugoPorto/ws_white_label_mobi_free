import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Chat } from './chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    ) { }

    async create(chat: CreateChatDto) {
        const { id_user, ...chatData } = chat;
        const newChat = this.chatRepository.create(chatData);
        newChat.user = { id: id_user } as User;
        return this.chatRepository.save(newChat);
    }

    async findByClientRequest(id_client_request: number) {
        return this.chatRepository.find({
            where: { id_client_request },
            order: { timestamp: 'DESC' },
            take: 10
        });
    }
}
