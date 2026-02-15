import { Test, TestingModule } from '@nestjs/testing';
import { UserDataRequestsService } from './user_data_requests.service';

describe('UserDataRequestsService', () => {
  let service: UserDataRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDataRequestsService],
    }).compile();

    service = module.get<UserDataRequestsService>(UserDataRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
