import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensorService {
  private client: mqtt.Client;
  private readonly sensorId: string;

  constructor() {
    this.sensorId = process.env.SENSOR_ID || `sensor-${Math.floor(Math.random() * 10000)}`;
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883');

    this.client.on('connect', () => {
      console.log(`Sensor ${this.sensorId} erfolgreich mit MQTT-Broker verbunden`);
    });

    this.client.on('error', (error) => {
      console.error('Verbindung zum MQTT-Broker fehlgeschlagen:', error);
    });
  }

  // Simuliert das Senden von Temperaturdaten
  startSendingTemperature() {
    interval(5000).pipe(
      map(() => ({
        room: `Raum-${Math.floor(Math.random() * 5) + 1}`, // Zufälliger Raum
        temperature: this.generateTemperature(20,3) // Zufällige Temperatur mit Mittelwert 20 und Standardabweichung 3
      }))
    ).subscribe(data => {
      const topic = `home/sensor/temperature/${data.room}`;
      console.log(`Sende Temperatur für ${data.room}: ${data.temperature}°C an ${topic}`);
      this.client.publish(topic, JSON.stringify(data), (err) => {
        if (err) {
          console.error('Fehler beim Senden der Temperatur:', err);
        } else {
          console.log(`Temperatur von ${data.temperature}°C für ${data.room} gesendet.`);
        }
      });
    });
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
