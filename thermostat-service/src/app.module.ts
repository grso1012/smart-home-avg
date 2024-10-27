import { Module } from '@nestjs/common';
import { ThermostatService } from './thermostat.service';

@Module({
  providers: [ThermostatService],
})
export class AppModule {}
