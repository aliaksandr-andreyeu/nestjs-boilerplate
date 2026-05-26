import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '@auth/auth.service';
import { PrismaService } from '@auth/prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
};

const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn()
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  it('should register a new user', async () => {
    const dto = { email: 'test@test.com', password: '123456' };
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'uuid', email: dto.email });

    const result = await service.register(dto);
    expect(result).toEqual({ id: 'uuid', email: dto.email });
    expect(mockPrisma.user.create).toHaveBeenCalled();
  });

  it('should throw on duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.register({ email: 'a@a.com', password: '123' })).rejects.toThrow('Email already exists');
  });

  it('should login and return tokens', async () => {
    const user = { id: '1', email: 'a@a.com', passwordHash: await bcrypt.hash('pass', 10) };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');
    mockPrisma.user.update.mockResolvedValue({});

    const result = await service.login({ email: 'a@a.com', password: 'pass' });
    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
  });
});
