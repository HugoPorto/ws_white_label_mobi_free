export class CreateUserDataRequestsDto {
    id_user: number;
    status: boolean;
    type: 'exclusion' | 'information';
}