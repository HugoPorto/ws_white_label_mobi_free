import { Point } from "geojson";
import { DriverTripOffers } from "src/driver_trip_offers/driver_trip_offers.entity";
import { User } from "src/users/user.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum Status {
    CREATED = 'CREATED',
    ACCEPTED = 'ACCEPTED',
    ON_THE_WAY = 'ON_THE_WAY',
    ARRIVED = 'ARRIVED',
    TRAVELLING = 'TRAVELLING',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED',
    STARTED = 'STARTED',
    EXPIRED = 'EXPIRED'
}

export enum ClientRequestType {
    COMMON = 'common',
    SCHEDULED = 'scheduled',
    DELIVERY = 'delivery',
    FREIGHT = 'freight'
}

export enum VehicleType {
    CAR = 'car',
    MOTORCYCLE = 'motorcycle',
    BICYCLE = 'bicycle',
    TRUCK = 'truck',
    VAN = 'van',
    HELICOPTER = 'helicopter',
    DRONE = 'drone',
    JET = 'jet',
    BOAT = 'boat',
    JET_SKI = 'jet_ski'
}

@Entity({ name: 'client_requests' })
export class ClientRequests {

    @PrimaryGeneratedColumn()
    id: number; // identificador único do pedido

    @Column()
    id_client: number; // identificador do cliente que fez o pedido

    @Column('decimal', { precision: 10, scale: 2 })
    fare_offered: number; // valor da tarifa oferecida pelo cliente

    @Column()
    pickup_description: string; // descrição do local de retirada

    @Column()
    destination_description: string; // descrição do local de destino

    @Column({ nullable: true })
    id_driver_assigned: number; // identificador do motorista atribuído ao pedido

    @Column({ nullable: true })
    fare_assigned: number; // valor da tarifa atribuída pelo motorista

    @Column('decimal', { nullable: true, precision: 5, scale: 2 })
    client_rating: number; // avaliação dada pelo cliente ao motorista

    @Column('decimal', { nullable: true, precision: 5, scale: 2 })
    driver_rating: number; // avaliação dada pelo motorista ao cliente

    @Index({ spatial: true })
    @Column({
        type: 'point',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: false
    })
    pickup_position: Point; // posição geográfica de retirada

    @Column({ nullable: true })
    pickup_description_plus: string; // complemento da descrição do local de retirada

    @Index({ spatial: true })
    @Column({
        type: 'point',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: false
    })
    destination_position: Point; // posição geográfica de destino

    @Column({ nullable: true })
    destination_description_plus: string; // complemento da descrição do local de destino

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.CREATED
    })
    status: Status; // status atual do pedido

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date; // data e hora de criação do pedido

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date; // data e hora da última atualização do pedido

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'id_client' })
    user: User; // cliente que fez o pedido

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'id_driver_assigned' })
    driverAssigned: User; // motorista atribuído ao pedido

    @OneToMany(() => DriverTripOffers, driverTripOffers => driverTripOffers.id_client_request, {
        cascade: true
    })
    driverTripOffers: DriverTripOffers; // ofertas de viagem feitas pelos motoristas para este pedido

    @Column({
        type: 'enum',
        enum: ClientRequestType,
        default: ClientRequestType.COMMON
    })
    clientRequestType: ClientRequestType; // tipo de pedido do cliente

    @Column({ type: 'datetime', nullable: true })
    scheduledFor: Date; // data e hora agendada para pedidos agendados

    // =======================================================
    // ============== Logística e localização ================
    // =======================================================
    // ================================================================================
    // ============== Esses campos ajudam em rastreamento e otimização ================
    // ================================================================================
    @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
    estimated_distance_km: number; // distância estimada entre origem e destino

    @Column({ type: 'int', nullable: true })
    estimated_duration_min: number; // tempo estimado da viagem em minutos

    @Column({ type: 'point', spatialFeatureType: 'Point', srid: 4326, nullable: true })
    current_driver_position: Point; // atualização em tempo real da posição do motorista

    // ===========================================================
    // ============== Controle temporal detalhado ================
    // ===========================================================
    // ============================================================================
    // ============== Melhora o monitoramento do fluxo da corrida: ================
    // ============================================================================
    @Column({ type: 'datetime', nullable: true })
    accepted_at: Date;

    @Column({ type: 'datetime', nullable: true })
    started_at: Date;

    @Column({ type: 'datetime', nullable: true })
    finished_at: Date;

    @Column({ type: 'datetime', nullable: true })
    cancelled_at: Date;

    @Column({ type: 'datetime', nullable: true })
    expired_at: Date;

    // ====================================================
    // ============== Pagamento e cobrança ================
    // ====================================================
    // ===============================================================================================
    // ============== Essencial se você for integrar com Stripe, Mercado Pago ou Pix: ================
    // ===============================================================================================
    @Column({
        type: 'enum',
        enum: ['cash', 'pix', 'credit_card', 'debit_card', 'wallet'],
        default: 'cash'
    })
    payment_method: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'wallet'; // método de pagamento escolhido

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    total_fare: number; // valor total cobrado ao cliente

    @Column({ type: 'varchar', length: 100, nullable: true })
    payment_transaction_id: string; // ID da transação no gateway

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    platform_fee: number; // taxa da plataforma

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    driver_earnings: number; // valor líquido que o motorista recebe

    @Column({ type: 'boolean', default: false })
    is_paid: boolean; // indica se o pagamento foi concluído

    // ======================================================
    // ============== Comunicação e feedback ================
    // ======================================================
    // =================================================================
    // ============== Para interação cliente–motorista: ================
    // =================================================================
    @Column({ type: 'text', nullable: true })
    client_notes: string; // observações do cliente (ex: "portão azul")

    @Column({ type: 'text', nullable: true })
    driver_notes: string; // observações do motorista

    @Column({ type: 'boolean', default: false })
    client_confirmed_arrival: boolean; // confirma se o cliente confirmou a chegada do motorista

    @Column({ type: 'boolean', default: false })
    driver_confirmed_delivery: boolean; // para pedidos de entrega, confirma se o motorista confirmou a entrega do pacote

    // =====================================================
    // ============== Estrutura e histórico ================
    // =====================================================
    // ==============================================================
    // ============== Ajuda no rastreio e auditoria: ================
    // ==============================================================
    @Column({ type: 'json', nullable: true })
    route_polyline: any; // caminho codificado (útil para reexibir a rota)

    @Column({ type: 'json', nullable: true })
    cancellation_reason: any; // armazena motivo, quem cancelou, hora, etc.

    @Column({
        type: 'enum',
        enum: ['android', 'ios', 'web'],
        default: 'android'
    })
    device_type: 'android' | 'ios' | 'web';

    @Column({ type: 'varchar', length: 50, nullable: true })
    request_source: string; // 'app_cliente', 'app_motorista', 'web_cliente', etc.

    // =================================================
    // ============== Entregas e fretes ================
    // =================================================
    // ==============================================================================
    // ============== Se o foco for expandir para entregas e cargas: ================
    // ==============================================================================
    @Column({ type: 'text', nullable: true })
    package_details: string; // detalhes do pacote para pedidos de entrega

    @Column({ nullable: true })
    image_package: string; // URL da imagem do pacote
    
    // @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
    // package_weight: number; // peso do pacote em kg

    @Column({nullable: true, length: 20 })
    package_weight: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    package_volume: number; // m³

    @Column({
        type: 'enum',
        enum: ['caixa', 'documento', 'mala', 'envelope', 'outro', 'indefinido'],
        default: 'indefinido'
    })
    package_type: 'caixa' | 'documento' | 'mala' | 'envelope' | 'outro' | 'indefinido'; // tipo de pacote

    @Column({ type: 'boolean', default: false })
    is_fragile: boolean; // indica se o pacote é frágil

    @Column({ type: 'boolean', default: false })
    requires_cooling: boolean; // indica se o pacote requer refrigeração

    @Column({ type: 'boolean', default: false })
    requires_signature: boolean; // indica se o pacote requer assinatura na entrega

    @Column({ type: 'text', nullable: true })
    sender_name: string; // nome do remetente

    @Column({ type: 'varchar', length: 20, nullable: true })
    sender_phone: string; // telefone do remetente

    @Column({ type: 'text', nullable: true })
    receiver_name: string; // nome do destinatário

    @Column({ type: 'varchar', length: 20, nullable: true })
    receiver_phone: string; // telefone do destinatário

    @Column({ nullable: true, length: 11 })
    receiver_cpf: string;

    // =====================================================
    // ============== Sistema e performance ================
    // =====================================================
    // ==================================================================
    // ============== Para auditoria e controle interno: ================
    // ==================================================================
    @Column({ type: 'varchar', length: 45, nullable: true })
    client_ip: string; // IP do cliente ao fazer o pedido

    @Column({ type: 'varchar', length: 45, nullable: true })
    driver_ip: string; // IP do motorista ao aceitar o pedido

    @Column({ type: 'boolean', default: false })
    is_test_request: boolean; // útil para sandbox/testes

    @Column({ type: 'boolean', default: false })
    has_issue_reported: boolean; // se o cliente reclamou algo

    @Column({ type: 'text', nullable: true })
    internal_notes: string; // notas internas da equipe de suporte

    @Column({ type: 'boolean', default: false })
    has_issue_driver_reported: boolean; // se o motorista reclamou algo

    @Column({
        type: 'enum',
        enum: VehicleType,
        default: VehicleType.CAR
    })
    vehicle_type: VehicleType;

    @Column({
        type: 'enum',
        enum: ['15', '20', '25', '30', '35', '40', '45', '50', '55', '60'],
        default: '15'
    })
    tolerance_minutes: '15' | '20' | '25' | '30' | '35' | '40' | '45' | '50' | '55' | '60'; // tolerância em minutos para chegada do motorista

    @Column({ type: 'text', nullable: true })
    distance_text: string; // distância em formato legível (ex: "5 km")

    @Column({ type: 'float', nullable: true })
    distance_value: number; // distância em quilômetros

    @Column({ type: 'text', nullable: true })
    duration_text: string; // duração em formato legível (ex: "15 mins")

    @Column({ type: 'float', nullable: true })
    duration_value: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    recommended_value: number; // valor recomendado para a corrida com base em distância e duração

    @Column({ type: 'float', nullable: true })
    km_value: number; // valor por km usado no cálculo do valor recomendado

    @Column({ type: 'float', nullable: true })
    min_value: number; // valor por minuto usado no cálculo do valor recomendado

    @Column({ type: 'varchar', nullable: true, length: 500 })
    client_report: string; // relatório do cliente sobre a corrida

    @Column({ type: 'varchar', nullable: true, length: 500 })
    driver_report: string; // relatório do motorista sobre a corrida

    @Column({ nullable: true })
    image_package_end: string;

    @Column({ type: 'varchar', length: 6, unique: true, nullable: true })
    code: string; // código único do pedido

    @Column({ type: 'varchar', length: 6, unique: true, nullable: true })
    invalid_code: string; // campo para validação de código incorreto
}