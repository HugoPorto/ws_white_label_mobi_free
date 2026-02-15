import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateChatIdentifyDto {
    @IsOptional()
    @IsNumber()
    id_sender?: number;

    @IsOptional()
    @IsNumber()
    id_receiver?: number;

    @IsOptional()
    @IsNumber()
    id_client_request?: number;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsNumber()
    id_user?: number;
}
