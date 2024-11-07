import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { logger } from './logger'

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
      logger.info(`Thermostat ${this.thermostatId} erfolgreich mit MQTT-Broker verbunden.`);
      this.client.subscribe(`home/thermostat/control/+`, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Abonnement auf home/thermostat/control/+ fehlgeschlagen:`, err);
        } else {
          logger.info(`Erfolgreich auf home/thermostat/control/+ abonniert.`);
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
    logger.info(`Empfange Steuerbefehl für ${room}: ${command}`);
    logger.info(
      `Heizung in ${room} ${command === 'Heizung_ein' ? 'eingeschaltet' : 'ausgeschaltet'}.`
    );
  }

  private sendQueuedCommands() {
    while (this.commandQueue.length > 0) {
      const { topic, message } = this.commandQueue.shift()!;
      this.client.publish(topic, message, { qos: 1, retain: true }, (err) => {
        if (err) {
          logger.error(`Fehler beim Wiederholen des Steuerbefehls:`, err);
          this.commandQueue.unshift({ topic, message });
          return;
        }
        logger.info(`Steuerbefehl aus Warteschlange gesendet: ${message} an ${topic}`);
      });
    }
  }
}
