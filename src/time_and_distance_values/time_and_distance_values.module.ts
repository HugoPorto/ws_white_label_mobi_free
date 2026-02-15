import { Module } from '@nestjs/common';
import { TimeAndDistanceValuesService } from './time_and_distance_values.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeAndDistanceValues } from './time_and_distance_values.entity';
import { TimeAndDistanceValuesController } from './time_and_distance_values.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ TimeAndDistanceValues ])],
  providers: [TimeAndDistanceValuesService],
  exports: [TimeAndDistanceValuesService],
  controllers: [TimeAndDistanceValuesController]
})
export class TimeAndDistanceValuesModule {}
