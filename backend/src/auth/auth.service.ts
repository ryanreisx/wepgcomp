import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Profile } from '@prisma/client';
import { UserService } from '../user/user.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=(?:.*\d){4,})(?=.*[^a-zA-Z0-9]).{8,}$/;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly messagingService: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    if (!PASSWORD_REGEX.test(dto.password)) {
      throw new BadRequestException(
        'Password must have at least 8 characters, 1 uppercase, 1 lowercase, 4 numbers and 1 special character',
      );
    }

    const isUfba = dto.email.endsWith('@ufba.br');
    let profile: Profile;
    let isActive: boolean;

    if (isUfba) {
      if (!dto.registrationNumber) {
        throw new BadRequestException(
          'Registration number is required for UFBA emails',
        );
      }
      if (
        !dto.profile ||
        (dto.profile !== Profile.DoctoralStudent &&
          dto.profile !== Profile.Professor)
      ) {
        throw new BadRequestException(
          'Profile must be DoctoralStudent or Professor for UFBA emails',
        );
      }
      profile = dto.profile;
      isActive = profile !== Profile.Professor;
    } else {
      profile = Profile.Listener;
      isActive = true;
    }

    const user = await this.userService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      registrationNumber: dto.registrationNumber,
      profile,
    });

    if (!isActive) {
      await this.prisma.userAccount.update({
        where: { id: user.id },
        data: { isActive: false },
      });
    }

    const token = randomUUID();
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
      },
    });

    await this.messagingService.publish('email-send', {
      email: dto.email,
      name: dto.name,
      token,
    });

    return { message: 'Registration successful. Please verify your email.' };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { emailVerifiedAt: new Date() },
    });

    await this.prisma.userAccount.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If the email exists, a verification link was sent.' };
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { userId: user.id },
    });

    if (!verification) {
      return { message: 'If the email exists, a verification link was sent.' };
    }

    const newToken = randomUUID();
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        emailVerificationToken: newToken,
        emailVerificationSentAt: new Date(),
      },
    });

    await this.messagingService.publish('email-send', {
      email: user.email,
      name: user.name,
      token: newToken,
    });

    return { message: 'If the email exists, a verification link was sent.' };
  }
}
