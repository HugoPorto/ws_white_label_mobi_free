import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from './status.entity';
import { User } from 'src/users/user.entity';
import { Balance } from 'src/balance/balance.entity';
import { SocketModule } from 'src/socket/socket.module';
import { BalanceService } from 'src/balance/balance.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Status, User, Balance]),
    SocketModule,
    ConfigModule
  ],
  providers: [StatusService, BalanceService],
  controllers: [StatusController]
})
export class StatusModule {}
