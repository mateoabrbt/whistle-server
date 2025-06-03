import { Test, TestingModule } from '@nestjs/testing';
import { RevokedService } from './revoked.service';

describe('RevokedService', () => {
  let service: RevokedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevokedService],
    }).compile();

    service = module.get<RevokedService>(RevokedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
