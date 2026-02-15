import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimeAndDistanceValues } from './time_and_distance_values.entity';
import { Repository } from 'typeorm';
import { UpdateTimeAndDistanceDto } from './dto/update-time-and-distance.dto';

@Injectable()
export class TimeAndDistanceValuesService {

    constructor(@InjectRepository(TimeAndDistanceValues) private timeAndDistanceValuesRepository: Repository<TimeAndDistanceValues>) { }

    find() {
        return this.timeAndDistanceValuesRepository.find({ where: { id: 1 } });
    }

    async update(timeAndDistance: UpdateTimeAndDistanceDto) {
        const timeAndDistanceFound = await this.timeAndDistanceValuesRepository.findOneBy({ id: timeAndDistance.id });

        if (!timeAndDistanceFound) {
            throw new Error('Valores de tempo e distância não encontrados');
        }

        const updatedTimeAndDistance = Object.assign(timeAndDistanceFound, timeAndDistance);

        return this.timeAndDistanceValuesRepository.save(updatedTimeAndDistance);
    }
}
