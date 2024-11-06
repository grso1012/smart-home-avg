import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HaussteuerungService } from './haussteuerung.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const haussteuerungService = app.get(HaussteuerungService);
  console.log('Haussteuerung gestartet.');
}
bootstrap();
