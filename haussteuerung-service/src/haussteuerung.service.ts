import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class HaussteuerungService implements OnModuleInit {
  private client: mqtt.Client;
  private readonly targetTemperatures: { [room: string]: number } = {};
  private readonly minTemp = 18;
  private readonly maxTemp = 24;
  private readonly sensorTopicPrefix = process.env.SENSOR_TOPIC_PREFIX || 'home/sensor/temperature';

  onModuleInit() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log('Haussteuerung erfolgreich mit MQTT-Broker verbunden.');
      this.client.subscribe(`${this.sensorTopicPrefix}/+`, (err) => {
        if (err) {
            console.error(`Fehler beim Abonnieren von ${this.sensorTopicPrefix}/+:`, err);
          } else {
            console.log(`Abonniert auf ${this.sensorTopicPrefix}/+.`);
          }
        });
      });

    this.client.on('message', (topic, message) => {
        const roomMatch = topic.match(new RegExp(`${this.sensorTopicPrefix}/(.+)`));
        if (roomMatch) {
          const room = roomMatch[1];  // Raum ist der dynamische Teil des Themas
          const parsedMessage = JSON.parse(message.toString());
          const temperature = parsedMessage.temperature;
          this.processTemperature(room, temperature);
      }
    });
  }

  private processTemperature(room: string, temperature: number) {
    console.log(`Empfangene Temperatur für ${room}: ${temperature}°C`);

    const targetTemperature = this.targetTemperatures[room] || 21; // Standardzieltemperatur
    let command = 'Heizung_aus';

    if (temperature < this.minTemp) {
      command = 'Heizung_ein';
    } else if (temperature > this.maxTemp) {
      command = 'Heizung_aus';
    } else {
      console.log(`Temperatur in ${room} im optimalen Bereich.`);
    }

    this.sendControlCommand(room, command, targetTemperature);
  }

  private sendControlCommand(room: string, command: string, targetTemperature: number) {
    const payload = JSON.stringify({ room, command, targetTemperature });
    this.client.publish(`home/thermostat/control/${room}`, payload, (err) => {
      if (err) {
        console.error(`Fehler beim Senden des Steuerbefehls für ${room}:`, err);
      } else {
        console.log(`Steuerbefehl an ${room} gesendet: ${command} bei ${targetTemperature}°C`);
      }
    });
  }
}
