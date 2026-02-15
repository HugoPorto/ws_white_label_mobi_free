import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance } from './balance.entity';
import { User } from 'src/users/user.entity';
import { SocketModule } from 'src/socket/socket.module';
import { JwtStrategy } from 'src/auth/jwt/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Balance, User]),
    SocketModule
  ],
  providers: [BalanceService, JwtStrategy],
  controllers: [BalanceController]
})
export class BalanceModule {}
