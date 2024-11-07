import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { logger } from './logger';

@Injectable()
export class SensorService {
  private client: mqtt.Client;
  private readonly sensorId: string;
  private commandQueue: Array<{ topic: string; message: string }> = [];

  constructor() {
    this.sensorId = process.env.SENSOR_ID || `sensor-${Math.floor(Math.random() * 10000)}`;
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      logger.info(`Sensor ${this.sensorId} erfolgreich mit MQTT-Broker verbunden`);
      this.sendQueuedCommands();
    });

    this.client.on('error', (error) => {
      logger.error('Verbindung zum MQTT-Broker fehlgeschlagen:', error);
    });
  }

  startSendingTemperature() {
    interval(10000)
      .pipe(
        map(() => ({
          room: `Raum-${Math.floor(Math.random() * 5) + 1}`,
          temperature: this.generateTemperature(20,7) // Zufällige Temperatur mit Mittelwert 20 und Standardabweichung 7
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
          logger.error('Fehler beim Senden der Temperatur:', err);
          this.commandQueue.push({ topic, message });
        } else {
          logger.info(`Temperatur gesendet: ${message} an ${topic}`);
        }
      });
    }
  }

  private sendQueuedCommands() {
    while (this.commandQueue.length > 0) {
      const { topic, message } = this.commandQueue.shift()!;
      this.client.publish(topic, message, { qos: 1, retain: true }, (err) => {
        if (err) {
          logger.error(`Fehler beim Wiederholen der Nachricht:`, err);
          this.commandQueue.unshift({ topic, message });
          return;
        }
        logger.info(`Nachricht aus Warteschlange gesendet: ${message} an ${topic}`);
      });
    }
  }

  generateTemperature(mittelwert: number, standardabweichung: number): number {
    if (mittelwert === undefined || standardabweichung === undefined) {
      throw new Error("ungültiger Funktionsaufruf generateTemperature");
    }
    // Die Temperaturwerte sind normalverteilt, benutzt wird die Box-Muller-Methode.
    //Quelle: https://de.wikipedia.org/wiki/Box-Muller-Methode
    const u = Math.random();
    const v = Math.random();
    
    // Erstellung Z Score
    const zWert = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    // Transformation vom Z Score
    const temp = Math.round(mittelwert + zWert * standardabweichung);

    return temp;
  }
}
