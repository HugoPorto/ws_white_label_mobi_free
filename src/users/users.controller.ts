import { Body, Controller, Post, Get, UseGuards, Put, Param, ParseIntPipe, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtRolesGuard } from '../auth/jwt/jwt-roles.guard';
import { HasRoles } from 'src/auth/jwt/has-roles';
import { JwtRole } from 'src/auth/jwt/jwt-role';
import { UpdateStatusUserDto } from './dto/update-status-user.dto';
import { UpdatePhoneVerifiedUserDto } from './dto/update-phone-verified-user.dto';

@Controller('users')
export class UsersController {

    constructor(private usersService: UsersService) { }

    // GET -> OBTER
    // POST -> CRIAR
    // PUT ' PATCH -> ATUALIZAR
    // DELETE ' => DELETAR

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get() // http://localhost/users -> GET
    findAll() {
        return this.usersService.findAll();
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Get(':id') // http://localhost/users/:id -> GET
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findById(id);
    }

    @Post() // http://localhost/users -> POST 
    create(@Body() user: CreateUserDto) {
        return this.usersService.create(user);
    }

    @Post('recover-password') // http://localhost/users/recover-password -> POST
    async recoverPassword(@Body() data: { email: string; phoneNumber: string }) {
        return this.usersService.updateAndSendPassword(data.email, data.phoneNumber);
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put(':id') // http://192.168.1.15:3000/users/:id -> PUT 
    update(@Param('id', ParseIntPipe) id: number, @Body() user: UpdateUserDto) {
        return this.usersService.update(id, user);
    }

    @HasRoles(JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('status/:id') // http://192.168.1.15:3000/users/status/:id -> PUT
    updateStatus(@Param('id', ParseIntPipe) id: number, @Body() user: UpdateStatusUserDto) {
        return this.usersService.updateStatus(id, user);
    }

    @HasRoles(JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('phone_verified/:id') // http://192.168.1.15:3000/users/phone_verified/:id -> PUT
    updatePhoneVerified(@Param('id', ParseIntPipe) id: number, @Body() user: UpdatePhoneVerifiedUserDto) {
        return this.usersService.updatePhoneVerified(id, user);
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.DRIVER, JwtRole.ADMIN)
    @Put('notification_token/:id') // http://192.168.1.15:3000/users/:id -> PUT 
    updateNotificationToken(@Param('id', ParseIntPipe) id: number, @Body() user: UpdateUserDto) {
        return this.usersService.update(id, user);
    }

    @HasRoles(JwtRole.CLIENT, JwtRole.DRIVER, JwtRole.ADMIN)
    @UseGuards(JwtAuthGuard, JwtRolesGuard)
    @Put('upload/:id')
    @UseInterceptors(FileInterceptor('file'))
    updateWithImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
                ],
            }),
        ) file: Express.Multer.File,
        @Param('id', ParseIntPipe) id: number,
        @Body() user: UpdateUserDto
    ) {
        return this.usersService.updateWithImage(file, id, user);
    }
}
