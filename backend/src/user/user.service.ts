import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserAccount, UserLevel, Profile } from '@prisma/client';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UserWithoutPassword = Omit<UserAccount, 'password'>;

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: CreateUserDto): Promise<UserWithoutPassword> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async findById(id: string): Promise<UserAccount> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<UserAccount[]> {
    return this.userRepository.findAll();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserAccount> {
    await this.findById(id);
    return this.userRepository.update(id, dto);
  }

  async remove(id: string): Promise<UserAccount> {
    await this.findById(id);
    return this.userRepository.update(id, {
      isActive: false,
      advisedSubmissions: { set: [] },
      authoredSubmissions: { set: [] },
      evaluations: { set: [] },
      panelists: { set: [] },
    });
  }

  async findPendingProfessors(): Promise<UserAccount[]> {
    const users = await this.userRepository.findAll();
    return users.filter(
      (u) =>
        u.profile === Profile.Professor &&
        u.isVerified === true &&
        u.isActive === false,
    );
  }

  async approveProfessor(id: string): Promise<UserAccount> {
    await this.findById(id);
    return this.userRepository.update(id, { isActive: true });
  }

  async rejectProfessor(id: string): Promise<UserAccount> {
    await this.findById(id);
    return this.userRepository.update(id, { isVerified: false });
  }

  async updateLevel(
    id: string,
    newLevel: UserLevel,
    callerLevel: UserLevel,
  ): Promise<UserAccount> {
    if (callerLevel === UserLevel.Default) {
      throw new ForbiddenException('Insufficient level to assign roles');
    }

    const targetUser = await this.findById(id);

    if (newLevel === UserLevel.Superadmin) {
      if (callerLevel !== UserLevel.Superadmin) {
        throw new ForbiddenException(
          'Only Superadmin can promote to Superadmin',
        );
      }
      if (targetUser.profile !== Profile.Professor) {
        throw new BadRequestException(
          'Only professors can be promoted to Superadmin',
        );
      }
    }

    return this.userRepository.update(id, { level: newLevel });
  }
}
