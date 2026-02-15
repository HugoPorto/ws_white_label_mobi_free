import { Status } from "../../client_requests/client_requests.entity";

export class UpdateStatusClientRequestDto {
    id_client_request: number;
    status: Status;    
}