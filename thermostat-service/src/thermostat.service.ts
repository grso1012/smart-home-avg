import { Injectable } from '@nestjs/common'; 
import { MessagePattern, Payload, Ctx, MqttContext } from '@nestjs/microservices';

@Injectable()
export class ThermostatService {
  private readonly minTemp = 18;
  private readonly maxTemp = 24;

  @MessagePattern('house/temperature')
  adjustHeating(@Payload() data: any, @Ctx() context: MqttContext) {

    console.log('Subscription erfolgreich. Nachricht erhalten.');

    const temperature = data.data?.temperature;
    console.log(`Empfangene Temperatur: ${temperature}°C`);

    if (temperature < this.minTemp) {
        console.log('Temperatur zu niedrig. Heizung hochdrehen.');
    } else if (temperature > this.maxTemp) {
        console.log('Temperatur zu hoch. Heizung runterdrehen.');
    } else {
        console.log('Temperatur im optimalen Bereich.');
    }
  }
}
