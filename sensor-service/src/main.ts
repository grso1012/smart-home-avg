import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SensorService } from './sensor.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const sensorService = app.get(SensorService);
  sensorService.startSendingTemperature();
}
bootstrap();
