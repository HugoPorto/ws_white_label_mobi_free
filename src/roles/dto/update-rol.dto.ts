import { IsOptional, IsString } from "class-validator";

export class UpdateRolDto {

    @IsOptional()
    @IsString()
    name?: string;
    
    @IsOptional()
    @IsString()
    image?: string;
    
    @IsOptional()
    @IsString()
    route?: string;

}