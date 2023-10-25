import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config/dist';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(configservice: ConfigService) {
        super({
            datasources: {
                db: {
                    url: configservice.get("DATABASE_URL")
                }
            }
        })
    }
}
