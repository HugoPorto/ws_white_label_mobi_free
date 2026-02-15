import { Veh } from "src/vehicles/veh.entity";
import { User } from "src/users/user.entity";
import { BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum DocumentType {
    VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION', // CRLV - Certificado de Registro e Licenciamento de Veículo
    DRIVER_LICENSE = 'DRIVER_LICENSE', // CNH - Carteira Nacional de Habilitação
    INSURANCE = 'INSURANCE', // Seguro do Veículo
    VEHICLE_PHOTO = 'VEHICLE_PHOTO', // Foto do Veículo
    INSPECTION = 'INSPECTION', // Vistoria do Veículo
    OTHER = 'OTHER' // Outros documentos
}

export enum DocumentStatus {
    PENDING = 'PENDING', // Pendente de análise
    APPROVED = 'APPROVED', // Aprovado
    REJECTED = 'REJECTED', // Rejeitado
    EXPIRED = 'EXPIRED' // Expirado
}

@Entity({ name: 'vehicle_documents' })
export class Document {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Veh, (vehicle) => vehicle.id, { nullable: false })
    @JoinColumn({ name: 'id_vehicle' })
    @Index()
    vehicle: Veh;

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'id_user' })
    @Index()
    user: User;

    @Column({
        type: 'enum',
        enum: DocumentType,
        nullable: false
    })
    @Index()
    documentType: DocumentType;

    @Column({
        type: 'enum',
        enum: DocumentStatus,
        default: DocumentStatus.PENDING
    })
    @Index()
    status: DocumentStatus;

    @Column({ nullable: false })
    fileUrl: string;

    @Column({ nullable: true })
    fileName: string;

    @Column({ nullable: true })
    fileSize: number; // Tamanho em bytes

    @Column({ nullable: true })
    mimeType: string; // Ex: image/jpeg, application/pdf

    @Column({ type: 'date', nullable: true })
    expirationDate: Date; // Data de validade do documento (CNH, CRLV, etc)

    @Column({ type: 'text', nullable: true })
    notes: string; // Notas adicionais (motivo de rejeição, observações, etc)

    @Column({ type: 'datetime', nullable: true })
    reviewedAt: Date; // Data em que foi analisado

    @ManyToOne(() => User, (user) => user.id, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewedBy: User; // Admin que analisou o documento

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}
