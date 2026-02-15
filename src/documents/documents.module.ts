import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './documents.entity';
import { User } from 'src/users/user.entity';
import { Veh } from 'src/vehicles/veh.entity';
import { UserSession } from 'src/user_sessions/user_sessions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, User, Veh, UserSession])
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService]
})
export class DocumentsModule {}
