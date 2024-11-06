import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class HaussteuerungService implements OnModuleInit {
  private client: mqtt.Client;
  private readonly targetTemperatures: { [room: string]: number } = {};
  private readonly minTemp = 18;
  private readonly maxTemp = 24;
  private readonly sensorTopicPrefix = process.env.SENSOR_TOPIC_PREFIX || 'home/sensor/temperature';
  private commandQueue: Array<{ topic: string; message: string }> = [];

  onModuleInit() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log('Haussteuerung erfolgreich mit MQTT-Broker verbunden.');
      this.leereWarteschlange();

      this.client.subscribe(`${this.sensorTopicPrefix}/+`, (err) => {
        if (err) {
          console.error(`Fehler beim Abonnieren von ${this.sensorTopicPrefix}/+:`, err);
        } else {
          console.log(`Abonniert auf ${this.sensorTopicPrefix}/+.`);
        }
      });

      this.sendQueuedCommands();
    });

    this.client.on('message', (topic, message) => {
      const roomMatch = topic.match(new RegExp(`${this.sensorTopicPrefix}/(.+)`));
      if (roomMatch) {
        const room = roomMatch[1];
        const parsedMessage = JSON.parse(message.toString());
        const temperature = parsedMessage.temperature;
        this.processTemperature(room, temperature);
      }
    });
  }

  private processTemperature(room: string, temperature: number) {
    console.log(`Empfangene Temperatur für ${room}: ${temperature}°C`);

    const targetTemperature = this.targetTemperatures[room] || 21;
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
    const topic = `home/thermostat/control/${room}`;
    const payload = JSON.stringify({ room, command, targetTemperature });

    if (!this.client.connected) {
      this.commandQueue.push({ topic, message: payload });
      return;
    }

    this.client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
      if (err) {
        console.error(`Fehler beim Senden des Steuerbefehls für ${room}:`, err);
        this.commandQueue.push({ topic, message: payload });
      } else {
        console.log(`Steuerbefehl an ${room} gesendet: ${command} bei ${targetTemperature}°C`);
      }
    });
  }

  private sendQueuedCommands() {
    while (this.commandQueue.length > 0) {
      const { topic, message } = this.commandQueue.shift()!;
      this.client.publish(topic, message, { qos: 1, retain: true }, (err) => {
        if (err) {
          console.error(`Fehler beim Wiederholen des Steuerbefehls:`, err);
          this.commandQueue.unshift({ topic, message });
          return;
        }
      });
    }
  }

  private leereWarteschlange() {
    console.log('Überprüfe und sende Nachrichten in der Warteschlange...');

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      if (command) {
        this.client.publish(command.topic, command.message, { qos: 1, retain: true }, (err) => {
          if (err) {
            console.error(
              `Fehler beim Senden aus der Warteschlange für Topic ${command.topic}:`,
              err
            );

            this.commandQueue.push(command);
          } else {
            console.log(`Nachricht aus Warteschlange gesendet für Topic ${command.topic}`);
          }
        });
      }
    }
  }
}
