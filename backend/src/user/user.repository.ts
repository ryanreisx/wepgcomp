import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserAccount } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserAccountCreateInput): Promise<UserAccount> {
    return this.prisma.userAccount.create({ data });
  }

  async findById(id: string): Promise<UserAccount | null> {
    return this.prisma.userAccount.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return this.prisma.userAccount.findUnique({ where: { email } });
  }

  async findAll(): Promise<UserAccount[]> {
    return this.prisma.userAccount.findMany();
  }

  async update(
    id: string,
    data: Prisma.UserAccountUpdateInput,
  ): Promise<UserAccount> {
    return this.prisma.userAccount.update({ where: { id }, data });
  }

  async delete(id: string): Promise<UserAccount> {
    return this.prisma.userAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
