import { Injectable } from '@nestjs/common';
import { Client, ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensorService {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.MQTT,
      options: { url: process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883' },
    });
  
   // Teste die Verbindung und logge eventuelle Fehler
   this.client.connect().then(() => {
    console.log('Erfolgreich mit MQTT-Broker verbunden');
  }).catch((error) => {
    console.error('Verbindung zum MQTT-Broker fehlgeschlagen:', error);
  });
  
}

  // Simuliert das regelmäßige Senden von Temperaturdaten
  startSendingTemperature() {
    interval(5000).pipe( // Alle 5 Sekunden eine neue Temperatur
      map(() => Math.floor(Math.random() * 30)) // Temperatur zwischen 0 und 30
    ).subscribe(temp => {
      console.log(`Sende Temperatur: ${temp}°C`);
      this.client.emit('temperature', { data: { temperature: temp} }).subscribe({
        complete: () => console.log(`Temperatur von ${temp}°C gesendet.`),
        error: (err) => console.error('Fehler beim Senden der Temperatur:', err),
      });
      console.log('Payload gesendet: ', JSON.stringify({ data: { temperature: temp } }));
    });
  }
}