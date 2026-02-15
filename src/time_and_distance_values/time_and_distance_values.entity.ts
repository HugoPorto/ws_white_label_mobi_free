import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'time_and_distance_values' })
export class TimeAndDistanceValues {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2 })
    km_value: number;

    @Column('decimal', { precision: 10, scale: 2 })
    min_value: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    km_value_motorcycle: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    min_value_motorcycle: number;
}