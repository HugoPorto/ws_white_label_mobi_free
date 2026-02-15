import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Messages } from './messages.entity';
import { MessageRead } from './message-reads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Messages, MessageRead])],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService]
})
export class MessagesModule {}
