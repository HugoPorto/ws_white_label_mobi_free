import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDataRequestsService } from './user_data_requests.service';
import { UserDataRequestsController } from './user_data_requests.controller';
import { UserDataRequests } from './user_data_requests.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDataRequests])],
  providers: [UserDataRequestsService],
  controllers: [UserDataRequestsController]
})
export class UserDataRequestsModule {}
