import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon from "argon2"
import { AuthDto } from "./dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  async register(authDTO: AuthDto) {
    //hashpassword
    const hashPassword = await argon.hash(authDTO.password)
    try {
      const user = await this.prismaService.user.create({
        data: {
          email: authDTO.email,
          hashPassword,
          lastName: '',
          firstName: ''
        },
        //select show fields u want
        select: {
          id: true,
          email: true,
          createAt: true
        }
      })
      return await this.convertJwtToken(user.id, user.email)
    } catch (error) {
      if (error.code === 'P2002') {
        return {
          msg: "Email này đã tồn tại. Vui lòng kiểm tra lại hoặc nhập email mới của bạn"
        }
      }
    }
  }
  async login(authDto: AuthDto) {
    //find user in database
    const user = await this.prismaService.user.findUnique({
      where: {
        email: authDto.email
      }
    })
    if (!user) {
      return {
        msg: "Sai email hoặc mật khẩu. Vui lòng kiểm tra lại!"
      }
    }
    const passwordMatched = await argon.verify(
      user.hashPassword,
      authDto.password
    )
    if (!passwordMatched) {
      return {
        msg: "Mật khẩu không đúng"
      }
    }
    delete user.hashPassword
    return await this.convertJwtToken(user.id, user.email)
  }
  async convertJwtToken(userId: number, email: string): Promise<{ accesstoken: string, refeshToken: string }> {
    const payload = {
      sub: userId,
      email
    }
    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: "10m",
      secret: this.configService.get('JWT_SECRET')
    })
    const refesh = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFESH'),
      expiresIn: "7d"
    })

    return {
      accesstoken: jwtString,
      refeshToken: refesh
    }
  }
}