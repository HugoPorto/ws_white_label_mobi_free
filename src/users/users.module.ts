import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtStrategy } from '../auth/jwt/jwt.strategy';
import { Rol } from 'src/roles/rol.entity';
import { Veh } from '../vehicles/veh.entity';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
  imports: [ 
    TypeOrmModule.forFeature([User, Rol, Veh]),
    TwilioModule
  ],
  providers: [UsersService, JwtStrategy],
  controllers: [UsersController]
})
export class UsersModule {}
