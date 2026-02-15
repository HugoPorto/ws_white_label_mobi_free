import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { TwilioService } from '../twilio/twilio.service';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService, private twilioService: TwilioService) { }

    @Post('register') // http://localhost/auth/register -> POST 
    register(@Body() user: RegisterAuthDto) {
        return this.authService.register(user);
    }


    @Post('login') // http://localhost/auth/login -> POST 
    login(@Body() loginData: LoginAuthDto) {
        return this.authService.login(loginData);
    }

    @Post('refresh') // http://localhost/auth/refresh -> POST
    refresh(@Body('refresh_token') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }

    @Post('send-code') // http://localhost/auth/send-code -> POST
    async sendCodeSms(@Body('phone') phone: string) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.twilioService.sendSms(phone, `Seu código é: ${code}`);
        return { success: true, message: 'Código enviado!' };
    }

    // @Post('send-code-verification') // http://localhost/auth/send-code-verification -> POST
    // async sendCode(@Body('phone') phone: string) {
    //     const result = await this.twilioService.sendVerification(phone);
    //     return { success: true, sid: result.sid };
    // }

    @Post('send-code-verification') // http://localhost/auth/send-code-verification -> POST
    async sendCode(@Body() data: { phone: string }) {
        // console.log('Received phone number:', data.phone);
        // return { success: true, message: 'Endpoint ativo. Implementação futura.' };
        const result = await this.twilioService.sendVerification(data.phone);
        console.log('Twilio response:', result);
        return { success: true, sid: result.sid };
    }

    @Post('verify-code') // http://localhost/auth/verify-code -> POST
    async verifyCode(@Body() data: { phone: string, code: string }) {
        const result = await this.twilioService.checkVerification(data.phone, data.code);
        console.log('Twilio verification result:', result);
        return { verified: result.status === 'approved' };
    }

    @Post('check-session') // http://localhost/auth/check-session -> POST
    async checkSession(@Body('session_id') session_id: string) {
        return await this.authService.checkSession(session_id);
    }
}
