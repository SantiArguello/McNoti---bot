const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require("discord.js");
const cron = require("node-cron");
require("dotenv").config();
const express = require("express");
const app = express();

const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1491126847570968799";
const GUILD_ID = "1473103402690154657";

const CHANNEL_ID = "1491131838700322846";

// 🌐 WEB
app.get("/", (req, res) => {
  res.send(`<h1>💀 MC Bot Activo</h1>`);
});
app.listen(process.env.PORT || 3000);

// 🎭 MENSAJES

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

function crearEmbed(eventoNombre, mensaje, tipoAviso) {
  let color = "#444444";

  if (tipoAviso === "activo") color = "#8B0000";
  else if (tipoAviso === 5) color = "#FF0000";
  else if (tipoAviso === 10) color = "#FFA500";
  else if (tipoAviso === 15) color = "#FFD700";

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(tipoAviso === "activo" ? "🚨 ACTIVIDAD DISPONIBLE" : "⚠️ INFORMACIÓN")
    .setDescription(`${eventoNombre}\n\n${mensaje}`)
    .setFooter({ text: "Sons Of The Road MC" })
    .setTimestamp();
}

// 📅 EVENTOS (GLOBAL)

const eventos = [
  {
    nombre: "💀 Tráfico ilegal",
    dias: [1,3,5,0],
    horas: [11,15,19],
    multiAviso: true
  },
  {
    nombre: "🚢 Tráfico naval",
    dias: null,
    horas: [11,15,19],
    multiAviso: true
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
    horas: [13,18],
    multiAviso: true
  },
  {
    nombre: "🚢 Tráfico naval avanzado",
    dias: null,
    horas: [13,18],
    multiAviso: true
  },
  {
    nombre: "🚗 Arrasa con sus vehículos",
    dias: null,
    horas: [16,19]
  },
  {
    nombre: "🔁 Tráfico múltiple",
    dias: [4,0],
    horas: [18],
    multiAviso: true
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
    horas: [16],
    multiAviso: true
  },
  {
    nombre: "🏪 Robo de almacén",
    dias: null,
    horas: [9,21],
    tipo: "ventana"
  },
  {
    nombre: "🏬 Robo de negocio",
    dias: null,
    horas: [9,21],
    tipo: "ventana"
  },
  {
    nombre: "💸 Mantenimiento de máquinas",
    dias: null,
    horas: [18]
  }
];

// 🔥 SLASH COMMAND

const commands = [
  new SlashCommandBuilder()
    .setName("proximos")
    .setDescription("Ver próximos eventos")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
})();

// 🧠 PROXIMOS

function obtenerProximosEventos() {
  const ahora = new Date();
  const eventosFuturos = [];

  eventos.forEach(evento => {
    evento.horas.forEach(hora => {

      const fecha = new Date();
      fecha.setHours(hora, 0, 0, 0);

      // si ya pasó hoy → lo pasamos a mañana
      if (fecha <= ahora) {
        fecha.setDate(fecha.getDate() + 1);
      }

      eventosFuturos.push({
        fecha,
        nombre: evento.nombre
      });

    });
  });

  // ordenar por fecha real
  eventosFuturos.sort((a, b) => a.fecha - b.fecha);

  return eventosFuturos.slice(0, 10);
}
// 🤖 CLIENT

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async () => {
  console.log(`Conectado como ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  eventos.forEach(evento => {
    evento.horas.forEach(hora => {

      const diasCron = evento.dias ? evento.dias.join(",") : "*";

      if (evento.multiAviso) {
        [15,10,5].forEach(min => {
          const total = hora * 60 - min;
          const h = Math.floor((total + 1440) % 1440 / 60);
          const m = (total + 1440) % 60;

          cron.schedule(`${m} ${h} * * ${diasCron}`, () => {
            const msg = getMensajeEvento(evento.nombre, min);
            const embed = crearEmbed(evento.nombre, `${msg}\n\nComienza en ${min} minutos.`, min);

            channel.send({ content: "@everyone", embeds: [embed] });
          }, { timezone: "America/Argentina/Buenos_Aires" });
        });

      } else {
        const hPrev = (hora - 1 + 24) % 24;

        cron.schedule(`55 ${hPrev} * * ${diasCron}`, () => {
          const msg = getMensajeEvento(evento.nombre, 5);
          const embed = crearEmbed(evento.nombre, `${msg}\n\nComienza en 5 minutos.`, 5);

          channel.send({ content: "@everyone", embeds: [embed] });
        }, { timezone: "America/Argentina/Buenos_Aires" });
      }

      cron.schedule(`0 ${hora} * * ${diasCron}`, () => {

        let mensaje;

        if (evento.tipo === "ventana") {
          mensaje = "Los objetivos están disponibles en la ciudad.\nAprovechen mientras dure.";
        } else {
          mensaje = getMensajeEvento(evento.nombre, "activo");
        }

        const embed = crearEmbed(evento.nombre, `${mensaje}\n\nYA DISPONIBLE.`, "activo");

        channel.send({ content: "@everyone", embeds: [embed] });

      }, { timezone: "America/Argentina/Buenos_Aires" });

    });
  });

});

// 🎯 COMANDO

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "proximos") {

  const lista = obtenerProximosEventos();

  if (!lista.length) {
    return interaction.reply("No hay eventos próximos.");
  }

  const texto = lista.map(e => {
    const h = e.fecha.getHours().toString().padStart(2, "0");
    const m = e.fecha.getMinutes().toString().padStart(2, "0");
    return `${h}:${m} - ${e.nombre}`;
  }).join("\n");

  const embed = new EmbedBuilder()
    .setColor("#00FFAA")
    .setTitle("⏳ Próximos eventos")
    .setDescription(texto)
    .setFooter({ text: "Sons Of The Road MC" })
    .setTimestamp();

  interaction.reply({ embeds: [embed] });
}
});

client.login(TOKEN);