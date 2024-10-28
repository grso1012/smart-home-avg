import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class ThermostatService implements OnModuleInit {
  private client: mqtt.Client;
  private readonly minTemp = 18;
  private readonly maxTemp = 24;

  onModuleInit() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log('Thermostat MQTT-Client erfolgreich verbunden.');
      this.client.subscribe('house/temperature', (err) => {
        if (err) {
          console.error('Abonnement auf house/temperature fehlgeschlagen:', err);
        } else {
          console.log('Erfolgreich auf house/temperature abonniert.');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      if (topic === 'house/temperature') {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Empfangene Nachricht:', parsedMessage); 
        this.adjustHeating(parsedMessage);
      }
    });
  }

  private adjustHeating(data: any) {
    console.log('Nachricht erfolgreich empfangen.');

    const temperature = data?.data?.data?.temperature;
    console.log(`Empfangene Temperatur: ${temperature !== undefined ? temperature + '°C' : 'undefined'}`);

    if (temperature === undefined) {
      console.error('Fehler: Temperaturwert nicht gefunden. Bitte Struktur des gesendeten Payload überprüfen.');
      return;
    }

    if (temperature < this.minTemp) {
      console.log('Temperatur zu niedrig. Heizung hochdrehen.');
    } else if (temperature > this.maxTemp) {
      console.log('Temperatur zu hoch. Heizung runterdrehen.');
    } else {
      console.log('Temperatur im optimalen Bereich.');
    }
  }
}
