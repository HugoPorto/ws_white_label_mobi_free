import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { Calls } from './calls.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Calls])],
  providers: [CallsService],
  controllers: [CallsController],
  exports: [CallsService]
})
export class CallsModule {}
