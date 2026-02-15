import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatIdentifyService } from './chat_identify.service';
import { ChatIdentifyController } from './chat_identify.controller';
import { ChatIdentify } from './chat_identify.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatIdentify])],
  providers: [ChatIdentifyService],
  controllers: [ChatIdentifyController],
  exports: [ChatIdentifyService]
})
export class ChatIdentifyModule {}
