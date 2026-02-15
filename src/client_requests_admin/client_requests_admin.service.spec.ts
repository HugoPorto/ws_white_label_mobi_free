import { Test, TestingModule } from '@nestjs/testing';
import { ClientRequestsAdminService } from './client_requests_admin.service';

describe('ClientRequestsAdminService', () => {
  let service: ClientRequestsAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientRequestsAdminService],
    }).compile();

    service = module.get<ClientRequestsAdminService>(ClientRequestsAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
