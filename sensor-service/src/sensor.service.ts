import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensorService {
  private client: mqtt.Client;
  private readonly sensorId: string;
  private commandQueue: Array<{ topic: string; message: string }> = [];

  constructor() {
    this.sensorId = process.env.SENSOR_ID || `sensor-${Math.floor(Math.random() * 10000)}`;
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log(`Sensor ${this.sensorId} erfolgreich mit MQTT-Broker verbunden`);
      this.sendQueuedCommands();
    });

    this.client.on('error', (error) => {
      console.error('Verbindung zum MQTT-Broker fehlgeschlagen:', error);
    });
  }

  startSendingTemperature() {
    interval(10000)
      .pipe(
        map(() => ({
          room: `Raum-${Math.floor(Math.random() * 5) + 1}`,
          temperature: Math.floor(Math.random() * 30),
        }))
      )
      .subscribe((data) => {
        const topic = `home/sensor/temperature/${data.room}`;
        const message = JSON.stringify(data);
        this.publishMessage(topic, message);
      });
  }

  private publishMessage(topic: string, message: string) {
    if (!this.client.connected) {
      this.commandQueue.push({ topic, message });
    } else {
      this.client.publish(topic, message, { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error('Fehler beim Senden der Temperatur:', err);
          this.commandQueue.push({ topic, message });
        } else {
          console.log(`Temperatur gesendet: ${message} an ${topic}`);
        }
      });
    }
  }

  private sendQueuedCommands() {
    while (this.commandQueue.length > 0) {
      const { topic, message } = this.commandQueue.shift()!;
      this.client.publish(topic, message, { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error(`Fehler beim Wiederholen der Nachricht:`, err);
          this.commandQueue.unshift({ topic, message });
          return;
        }
        console.log(`Nachricht aus Warteschlange gesendet: ${message} an ${topic}`);
      });
    }
  }
}
