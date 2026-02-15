import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { SocketModule } from './socket/socket.module';
import { DriversPositionModule } from './drivers_position/drivers_position.module';
import { ClientRequestsModule } from './client_requests/client_requests.module';
import { TimeAndDistanceValuesModule } from './time_and_distance_values/time_and_distance_values.module';
import { DriverTripOffersModule } from './driver_trip_offers/driver_trip_offers.module';
import { DriverCarInfoModule } from './driver_car_info/driver_car_info.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { StatusModule } from './status/status.module';
import { BalanceModule } from './balance/balance.module';
import { ChatModule } from './chat/chat.module';
import { TwilioModule } from './twilio/twilio.module';
import { UserDataRequestsModule } from './user_data_requests/user_data_requests.module';
import { MessagesModule } from './messages/messages.module';
import { CallsModule } from './calls/calls.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatIdentifyModule } from './chat_identify/chat_identify.module';
import { ConfigService } from '@nestjs/config';
import { ClientRequestsAdminModule } from './client_requests_admin/client_requests_admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', '12345'),
        database: configService.get<string>('DB_NAME', 'ddriver_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      })
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    SocketModule,
    DriversPositionModule,
    ClientRequestsModule,
    TimeAndDistanceValuesModule,
    DriverTripOffersModule,
    DriverCarInfoModule,
    FirebaseModule,
    VehiclesModule,
    StatusModule,
    BalanceModule,
    ChatModule,
    TwilioModule,
    UserDataRequestsModule,
    MessagesModule,
    CallsModule,
    DocumentsModule,
    ChatIdentifyModule,
    ClientRequestsAdminModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
