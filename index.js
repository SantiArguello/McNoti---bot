const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
require("dotenv").config();
const express = require("express");
const app = express();

// 🎭 MENSAJES POR TIPO DE EVENTO

function getMensajeEvento(nombre, tipoAviso) {
  const base = {
    ilegal: {
      15: "Se detectaron movimientos ilegales en la ciudad.",
      10: "Las rutas comienzan a moverse.",
      5: "Todo está listo. Es ahora.",
      activo: "Las calles están calientes.",
    },
    naval: {
      15: "Actividad sospechosa en la costa.",
      10: "Los muelles comienzan a activarse.",
      5: "Las aguas están liberadas.",
      activo: "Operaciones navales en curso.",
    },
    acuatico: {
      15: "Zona marítima en observación.",
      10: "Se detecta actividad bajo el agua.",
      5: "Todo listo para sumergirse.",
      activo: "Zona submarina habilitada.",
    },
    multiple: {
      15: "Se prepara una operación a gran escala.",
      10: "Todo empieza a moverse.",
      5: "Todo en posición.",
      activo: "Operación múltiple en curso.",
    },
    general: {
      15: "Se detectó movimiento en la ciudad.",
      10: "La situación se está desarrollando.",
      5: "Últimos preparativos.",
      activo: "Actividad en curso.",
    },
  };

  let tipo = "general";

  if (nombre.includes("ilegal")) tipo = "ilegal";
  if (nombre.includes("naval")) tipo = "naval";
  if (nombre.includes("acuática")) tipo = "acuatico";
  if (nombre.includes("múltiple")) tipo = "multiple";

  return base[tipo][tipoAviso];
}

// 🎨 EMBED

function crearEmbed(eventoNombre, mensaje, tipoAviso) {
  let color = "#444444";

  if (tipoAviso === "activo") color = "#8B0000";
  else if (tipoAviso === 5) color = "#FF0000";
  else if (tipoAviso === 10) color = "#FFA500";
  else if (tipoAviso === 15) color = "#FFD700";

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(
      tipoAviso === "activo" ? "🚨 ACTIVIDAD DISPONIBLE" : "⚠️ INFORMACIÓN",
    )
    .setDescription(
      `
${eventoNombre}

${mensaje}
    `,
    )
    .setFooter({ text: "Sons Of The Road MC" })
    .setTimestamp();
}

app.get("/", (req, res) => {
  res.send(`
    <h1>💀 MC Bot Activo</h1>
    <p>Sons Of The Road MC</p>
  `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor web activo en puerto ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.TOKEN;

// 🔥 PEGÁ ACÁ EL ID DEL CANAL
const CHANNEL_ID = "1491131838700322846";

client.once("clientReady", async () => {
  console.log(`Conectado como ${client.user.tag}`);

  let channel;

  try {
    channel = await client.channels.fetch(CHANNEL_ID);
  } catch (error) {
    console.log("No pude encontrar el canal con ese ID");
    return;
  }

  if (!channel) {
    console.log("Canal no encontrado");
    return;
  }

  const eventos = [
    {
      nombre: "💀 Tráfico ilegal",
      dias: [1, 3, 5, 0],
      horas: [11, 15, 19],
      multiAviso: true,
    },
    {
      nombre: "🚢 Tráfico naval",
      dias: null,
      horas: [11, 15, 19],
      multiAviso: true,
    },
    {
      nombre: "🏍️ Robo de motocicleta",
      dias: null,
      horas: [22, 10, 14, 16, 17, 19],
    },
    {
      nombre: "📦 Búsqueda de contenedores",
      dias: null,
      horas: [23, 6, 12, 18],
    },
    {
      nombre: "🧪 Reparto de químicos",
      dias: null,
      horas: [14],
    },
    {
      nombre: "💀 Tráfico ilegal avanzado",
      dias: [1, 3, 5, 0],
      horas: [13, 18],
      multiAviso: true,
    },
    {
      nombre: "🚢 Tráfico naval avanzado",
      dias: null,
      horas: [13, 18],
      multiAviso: true,
    },
    {
      nombre: "🚗 Arrasa con sus vehículos",
      dias: null,
      horas: [16, 19],
    },
   
    {
      nombre: "🔁 Tráfico múltiple",
      dias: [4, 0],
      horas: [18],
      multiAviso: true,
    },
    {
      nombre: "🫀 Tráfico de órganos",
      dias: null,
      horas: [18],
    },
    {
      nombre: "🔒 Secuestrado",
      dias: null,
      horas: [13],
    },
    {
      nombre: "🌊 Búsqueda acuática",
      dias: [1, 6, 0],
      horas: [16],
      multiAviso: true,
    },
    {
      nombre: "🏪 Robo de almacén",
      dias: null,
      horas: [21, 9],
    },
    {
      nombre: "🏬 Robo de negocio",
      dias: null,
      horas: [21, 9],
    },
    {
      nombre: "💸 Mantenimiento de máquinas",
      dias: null,
      horas: [18],
    },
  ];

  eventos.forEach((evento) => {
    evento.horas.forEach((hora) => {
      const diasCron = evento.dias ? evento.dias.join(",") : "*";

      // 🔥 EVENTOS IMPORTANTES (15,10,5)
      if (evento.multiAviso) {
        const avisos = [15, 10, 5];

        avisos.forEach((min) => {
          const totalMin = hora * 60 - min;
          const horaAviso = Math.floor(((totalMin + 1440) % 1440) / 60);
          const minutoAviso = (totalMin + 1440) % 60;

          cron.schedule(
            `${minutoAviso} ${horaAviso} * * ${diasCron}`,
            () => {
              const mensaje = getMensajeEvento(evento.nombre, min);
              const embed = crearEmbed(
                evento.nombre,
                `${mensaje}\n\nComienza en ${min} minutos.`,
                min,
              );

              channel.send({
                content: "@everyone",
                embeds: [embed],
              });
            },
            {
              timezone: "America/Argentina/Buenos_Aires",
            },
          );
        });
      } else {
        // ⏳ SOLO 5 MIN (como antes)
        const minutoPrevio = 55;
        const horaPrevia = (hora - 1 + 24) % 24;

        cron.schedule(
          `${minutoPrevio} ${horaPrevia} * * ${diasCron}`,
          () => {
            const mensaje = getMensajeEvento(evento.nombre, 5);
const embed = crearEmbed(evento.nombre, `${mensaje}\n\nComienza en 5 minutos.`, 5);

channel.send({
  content: '@everyone',
  embeds: [embed]
});
          },
          {
            timezone: "America/Argentina/Buenos_Aires",
          },
        );
      }

      // 🚨 INICIO (para TODOS)
      cron.schedule(
        `0 ${hora} * * ${diasCron}`,
        () => {
          const mensaje = getMensajeEvento(evento.nombre, 'activo');
const embed = crearEmbed(evento.nombre, `${mensaje}\n\nYA DISPONIBLE.`, 'activo');

channel.send({
  content: '@everyone',
  embeds: [embed]
});
        },
        {
          timezone: "America/Argentina/Buenos_Aires",
        },
      );
    });
  });
});

client.login(TOKEN);
