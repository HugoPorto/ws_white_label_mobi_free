import { Module } from '@nestjs/common';
import { ClientRequestsAdminService } from './client_requests_admin.service';
import { ClientRequestsAdminController } from './client_requests_admin.controller';
import { TimeAndDistanceValuesModule } from 'src/time_and_distance_values/time_and_distance_values.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { ClientRequests } from '../client_requests/client_requests.entity';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  providers: [ClientRequestsAdminService],
  controllers: [ClientRequestsAdminController],
  imports: [
    TimeAndDistanceValuesModule,
    TypeOrmModule.forFeature(
      [
        ClientRequests,
        User
      ]), FirebaseModule],
  exports: [ClientRequestsAdminService]
})
export class ClientRequestsAdminModule { }
