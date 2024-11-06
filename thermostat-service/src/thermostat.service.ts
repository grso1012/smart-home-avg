import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class ThermostatService implements OnModuleInit {
  private client: mqtt.Client;
  private readonly thermostatId: string;

  constructor() {
    this.thermostatId = process.env.THERMOSTAT_ID || `thermostat-${Math.floor(Math.random() * 10000)}`;
  }

  onModuleInit() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log(`Thermostat ${this.thermostatId} erfolgreich mit MQTT-Broker verbunden.`);
      this.client.subscribe(`home/thermostat/control/+`, (err) => {
        if (err) {
          console.error(`Abonnement auf home/thermostat/control/+ fehlgeschlagen:`, err);
        } else {
          console.log(`Erfolgreich auf home/thermostat/control/+ abonniert.`);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const parsedMessage = JSON.parse(message.toString());
      this.applyHeatingCommand(parsedMessage.room, parsedMessage.command);
    });
  }

  private applyHeatingCommand(room: string, command: string) {
    console.log(`Empfange Steuerbefehl für ${room}: ${command}`);

    console.log(`Heizung in ${room} ${command === 'Heizung_ein' ? 'eingeschaltet' : 'ausgeschaltet'}.`);
}
}
