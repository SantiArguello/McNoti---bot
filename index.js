const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();
const express = require('express');

const app = express();

// 🌐 Servidor web para que Render no duerma
app.get('/', (req, res) => {
  res.send('Bot activo');
});

app.listen(3000, () => {
  console.log('Servidor web activo');
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;

// 🔥 PEGÁ ACÁ EL ID DEL CANAL
const CHANNEL_ID = '1491131838700322846';

client.once('clientReady', async () => {
  console.log(`Conectado como ${client.user.tag}`);

  let channel;

  try {
    channel = await client.channels.fetch(CHANNEL_ID);
  } catch (error) {
    console.log('No pude encontrar el canal con ese ID');
    return;
  }

  if (!channel) {
    console.log('Canal no encontrado');
    return;
  }

  const eventos = [
    {
      nombre: "💀 Tráfico ilegal",
      dias: [1,3,5,0],
      horas: [11,15,19]
    },
    {
      nombre: "🚢 Tráfico naval",
      dias: null,
      horas: [11,15,19]
    },
    {
      nombre: "🏍️ Robo de motocicleta",
      dias: null,
      horas: [22,10,14,16,17,19]
    },
    {
      nombre: "📦 Búsqueda de contenedores",
      dias: null,
      horas: [23,6,12,18]
    },
    {
      nombre: "🧪 Reparto de químicos",
      dias: null,
      horas: [14]
    },
    {
      nombre: "💀 Tráfico ilegal avanzado",
      dias: [1,3,5,0],
      horas: [13,18]
    },
    {
      nombre: "🚢 Tráfico naval avanzado",
      dias: null,
      horas: [13,18]
    },
    {
      nombre: "🚗 Arrasa con sus vehículos",
      dias: null,
      horas: [16,19]
    },
    {
      nombre: "💸 Lavado de dinero",
      dias: [3,5,6,0],
      horas: [18]
    },
    {
      nombre: "🔁 Tráfico múltiple",
      dias: [4,0],
      horas: [18]
    },
    {
      nombre: "🫀 Tráfico de órganos",
      dias: null,
      horas: [18]
    },
    {
      nombre: "🔒 Secuestrado",
      dias: null,
      horas: [13]
    },
    {
      nombre: "🌊 Búsqueda acuática",
      dias: [1,6,0],
      horas: [16]
    }
  ];

  eventos.forEach(evento => {
    evento.horas.forEach(hora => {

      const minutoPrevio = 55;
      const horaPrevia = (hora - 1 + 24) % 24;
      const diasCron = evento.dias ? evento.dias.join(',') : '*';

      // ⏳ 5 minutos antes
      cron.schedule(`${minutoPrevio} ${horaPrevia} * * ${diasCron}`, () => {
        channel.send(`@everyone ⏳ **En 5 minutos comienza:** ${evento.nombre}`);
      }, {
        timezone: "America/Argentina/Buenos_Aires"
      });

      // 🚨 Inicio
      cron.schedule(`0 ${hora} * * ${diasCron}`, () => {
        channel.send(`@everyone 🚨 **ACTIVO:** ${evento.nombre}`);
      }, {
        timezone: "America/Argentina/Buenos_Aires"
      });

    });
  });

});

client.login(TOKEN);