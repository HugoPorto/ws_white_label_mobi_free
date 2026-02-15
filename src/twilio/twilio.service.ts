import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioService {
    private client: Twilio;

    constructor(private configService: ConfigService) {
        this.client = new Twilio(
            this.configService.get<string>('TWILIO_ACCOUNT_SID'),
            this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        );
    }

    async sendSms(to: string, body: string) {
        return this.client.messages.create({
            body,
            from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
            to,
        });
    }

    async sendVerification(to: string) {
        console.log('Sending verification to:', to);
        return this.client.verify.v2
            .services(this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID'))
            .verifications.create({ to, channel: 'sms' });
    }

    async checkVerification(to: string, code: string) {
        return this.client.verify.v2
            .services(this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID'))
            .verificationChecks.create({ to, code });
    }
}
