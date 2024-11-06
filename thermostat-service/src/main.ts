import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  console.log(`MQTT Broker URL: ${process.env.MQTT_BROKER_URL}`);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.MQTT,
    options: {
      url: process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883',
    },
  });

  await app.listen();
  console.log('Thermostat-Service mit MQTT-Broker verbunden.');
}
bootstrap();
