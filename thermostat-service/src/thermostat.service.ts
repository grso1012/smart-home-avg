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
      this.client.subscribe(`home/thermostat/control/${this.thermostatId}`, (err) => {
        if (err) {
          console.error(`Abonnement auf home/thermostat/control/${this.thermostatId} fehlgeschlagen:`, err);
        } else {
          console.log(`Erfolgreich auf home/thermostat/control/${this.thermostatId} abonniert.`);
        }
      });
    });

    this.client.on('message', (topic, message) =>{
        const parsedMessage = JSON.parse(message.toString());
        this.applyHeatingCommand(parsedMessage.room, parsedMessage.command, parsedMessage.targetTemperature);
    });
  }

  private applyHeatingCommand(room: string, command: string, targetTemperature: number) {
    console.log(`Empfange Steuerbefehl für ${room}: ${command} bei Zieltemperatur ${targetTemperature}°C`);

    if (command === 'Heizung_ein') {
      console.log(`Heizung in ${room} eingeschaltet.`);
    } else if (command === 'Heizung_aus') {
      console.log(`Heizung in ${room} ausgeschaltet.`);
    }
  }
}