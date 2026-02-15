import { Test, TestingModule } from '@nestjs/testing';
import { ChatIdentifyService } from './chat_identify.service';

describe('ChatIdentifyService', () => {
  let service: ChatIdentifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatIdentifyService],
    }).compile();

    service = module.get<ChatIdentifyService>(ChatIdentifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
