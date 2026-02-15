export class CreateClientRequestDto {

    id_client: number;
    fare_offered: number;
    pickup_description: string;
    destination_description: string;
    pickup_lat: number;
    pickup_lng: number;
    destination_lat: number;
    destination_lng: number;
    vehicle_type: 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'van' | 'helicopter' | 'drone' | 'jet' | 'boat' | 'jet_ski';
    scheduledFor?: string;
    pickup_description_plus?: string;
    destination_description_plus?: string;
    tolerance_minutes?: '15' | '20' | '25' | '30' | '35' | '40' | '45' | '50' | '55' | '60';
    clientRequestType?: 'common' | 'scheduled' | 'delivery' | 'freight';
    distance_text?: string;
    distance_value?: number;
    duration_text?: string;
    duration_value?: number;
    recommended_value?: number;
    km_value?: number;
    min_value?: number;
    package_details?: string;
    image_package?: string;
    package_weight?: string;
    package_volume?: number;
    package_type?: 'caixa' | 'documento' | 'mala' | 'envelope' | 'outro' | 'indefinido';
    is_fragile?: boolean;
    requires_cooling?: boolean;
    requires_signature?: boolean;
    sender_name?: string;
    sender_phone?: string;
    receiver_name?: string;
    receiver_phone?: string;
    receiver_cpf?: string;
    code?: string;
}