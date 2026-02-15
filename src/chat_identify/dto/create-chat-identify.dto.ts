import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChatIdentifyDto {
    @IsNotEmpty()
    @IsNumber()
    id_sender: number;

    @IsNotEmpty()
    @IsNumber()
    id_receiver: number;

    @IsOptional()
    @IsNumber()
    id_client_request?: number;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsNumber()
    id_user: number;
}
