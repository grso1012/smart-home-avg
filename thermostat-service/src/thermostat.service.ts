import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class ThermostatService implements OnModuleInit {
  private client: mqtt.Client;
  private readonly thermostatId: string;
  private commandQueue: Array<{ topic: string; message: string }> = [];

  constructor() {
    this.thermostatId =
      process.env.THERMOSTAT_ID || `thermostat-${Math.floor(Math.random() * 10000)}`;
  }

  onModuleInit() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log(`Thermostat ${this.thermostatId} erfolgreich mit MQTT-Broker verbunden.`);
      this.client.subscribe(`home/thermostat/control/+`, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Abonnement auf home/thermostat/control/+ fehlgeschlagen:`, err);
        } else {
          console.log(`Erfolgreich auf home/thermostat/control/+ abonniert.`);
        }
      });
      this.sendQueuedCommands();
    });

    this.client.on('message', (topic, message) => {
      const parsedMessage = JSON.parse(message.toString());
      this.applyHeatingCommand(parsedMessage.room, parsedMessage.command);
    });
  }

  private applyHeatingCommand(room: string, command: string) {
    console.log(`Empfange Steuerbefehl für ${room}: ${command}`);
    console.log(
      `Heizung in ${room} ${command === 'Heizung_ein' ? 'eingeschaltet' : 'ausgeschaltet'}.`
    );
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
        console.log(`Steuerbefehl aus Warteschlange gesendet: ${message} an ${topic}`);
      });
    }
  }
}
