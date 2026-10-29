import { Controller, Get } from '@nestjs/common';
@Controller('health') export class HealthController { @Get() check() { return { status: 'ok', service: 'agritech-api', version: 'v1', timestamp: new Date().toISOString() }; } }
