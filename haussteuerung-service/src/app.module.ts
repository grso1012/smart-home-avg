import { Module } from '@nestjs/common';
import { HaussteuerungService } from './haussteuerung.service';

@Module({
  providers: [HaussteuerungService],
})
export class AppModule {}
