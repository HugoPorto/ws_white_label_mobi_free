import { IsString, IsBoolean, IsEnum, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
    @IsNotEmpty()
    @IsString()
    text: string;

    @IsNotEmpty()
    timestamp: Date;

    @IsBoolean()
    @IsNotEmpty()
    isMe: boolean;

    @IsEnum(['read', 'unread'])
    @IsNotEmpty()
    status: 'read' | 'unread';

    @IsEnum(['text', 'image', 'video'])
    @IsNotEmpty()
    type: 'text' | 'image' | 'video';

    @IsNumber()
    @IsNotEmpty()
    id_user: number;

    @IsNumber()
    @IsNotEmpty()
    id_sender: number;

    @IsNumber()
    @IsNotEmpty()
    id_receiver: number;

    @IsNumber()
    @IsNotEmpty()
    id_client_request: number;
}