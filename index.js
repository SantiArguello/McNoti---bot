require("dotenv").config();
process.env.TZ = "America/Argentina/Buenos_Aires";

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require("discord.js");
const cron = require("node-cron");
const express = require("express");
const fs = require("fs");
const app = express();

const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1491126847570968799";
const GUILD_ID = "1473103402690154657";

const CHANNEL_ID = "1491131838700322846"; // actividades
const CANAL_SECUESTRADO_ID = "1473846425149247701";

const FILE_PATH = "./secuestrados.json";

// 🌐 WEB
app.get("/", (req, res) => {
  res.send(`<h1>💀 MC Bot Activo</h1>`);
});
app.listen(process.env.PORT || 3000);

// =======================
// 🧠 SECUESTRADOS
// =======================

function cargarData() {
  if (!fs.existsSync(FILE_PATH)) return { secuestrados: [] };
  return JSON.parse(fs.readFileSync(FILE_PATH));
}

function guardarData(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

async function programarSecuestrado(client, sec) {
  if (!sec.listoEn) return;

  const tiempoRestante = sec.listoEn - Date.now();
  if (tiempoRestante <= 0) return;

  setTimeout(async () => {
    const canal = await client.channels.fetch(CHANNEL_ID);

    canal.send(`🔒 Secuestrado #${sec.id} disponible nuevamente.`);

    const data = cargarData();
    const s = data.secuestrados.find(x => x.id === sec.id);

    if (s) {
      s.estado = "activo";
      s.listoEn = null;
      guardarData(data);
    }
  }, tiempoRestante);
}

// =======================
// 🎭 MENSAJES
// =======================

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

function getHoraFin(nombre, horaInicio) {

  const fin = {

    "💀 Tráfico ilegal": {
      11: 12,
      15: 16,
      19: 20
    },

    "🚢 Tráfico naval": {
      11: 12,
      15: 16,
      19: 20
    },

    "💀 Tráfico ilegal avanzado": {
      13: 15,
      18: 19
    },

    "🚢 Tráfico naval avanzado": {
      13: 15,
      18: 19
    },

    "🏍️ Robo de motocicleta": {
      10: 12,
      14: 15,
      16: 17,
      17: 18,
      19: 20,
      22: 23
    },

    "📦 Búsqueda de contenedores": {
      6: 8,
      12: 14,
      18: 20,
      23: 0
    },

    "🧪 Reparto de químicos": {
      14: 15
    },

    "🚗 Arrasa con sus vehículos": {
      16: 17,
      19: 20
    },

    "🔁 Tráfico múltiple": {
      18: 19
    },

    "🫀 Tráfico de órganos": {
      18: 20
    },

    "🌊 Búsqueda acuática": {
      16: 17
    },

    "💸 Mantenimiento de máquinas": {
      18: 19
    },

    "🏪 Robo de almacén": {
      9: 11,
      21: 23
    },

    "🏬 Robo de negocio": {
      9: 11,
      21: 23
    }

  };

  return fin[nombre]?.[horaInicio] ?? null;
}

// =======================
// 📅 EVENTOS
// =======================

const eventos = [
  { nombre: "💀 Tráfico ilegal", dias: [1,3,5,0], horas: [11,15,19], multiAviso: true },
  { nombre: "🚢 Tráfico naval", dias: [2,4,6], horas: [11,15,19], multiAviso: true },
  { nombre: "🏍️ Robo de motocicleta", dias: null, horas: [22,10,14,16,17,19] },
  { nombre: "📦 Búsqueda de contenedores", dias: null, horas: [23,6,12,18] },
  { nombre: "🧪 Reparto de químicos", dias: null, horas: [14] },
  { nombre: "💀 Tráfico ilegal avanzado", dias: [1,3,5,0], horas: [13,18], multiAviso: true },
  { nombre: "🚢 Tráfico naval avanzado", dias: [2,4,6], horas: [13,18], multiAviso: true },
  { nombre: "🚗 Arrasa con sus vehículos", dias: [2,4,6,0], horas: [16,19] },
  { nombre: "🔁 Tráfico múltiple", dias: [4,0], horas: [18], multiAviso: true },
  { nombre: "🫀 Tráfico de órganos", dias: [2], horas: [18] },
  { nombre: "🔒 Secuestrado", dias: [2], horas: [13] },
  { nombre: "🌊 Búsqueda acuática", dias: [1,6,0], horas: [16], multiAviso: true },
  { nombre: "🏪 Robo de almacén", dias: null, horas: [9,21], tipo: "ventana" },
  { nombre: "🏬 Robo de negocio", dias: null, horas: [9,21], tipo: "ventana" },
  { nombre: "💸 Mantenimiento de máquinas", dias: null, horas: [18] }
];

// =======================
// 🔥 SLASH COMMANDS
// =======================

const commands = [
  new SlashCommandBuilder().setName("proximos").setDescription("Ver próximos eventos"),
  new SlashCommandBuilder().setName("help").setDescription("Ver comandos del bot"),
  new SlashCommandBuilder().setName("newsecuestro").setDescription("Crear secuestrado"),

  new SlashCommandBuilder()
    .setName("revisado")
    .setDescription("Poner en enfriamiento")
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("ID del secuestrado")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("muerto")
    .setDescription("Eliminar secuestrado")
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("ID del secuestrado")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("secuestrados")
    .setDescription("Ver estado")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
})();

// =======================
// 🤖 CLIENT
// =======================

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", async () => {
  console.log(`Conectado como ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  // recuperar secuestrados
  const data = cargarData();
  data.secuestrados.forEach(sec => {
    if (sec.estado === "enfriamiento") {
      programarSecuestrado(client, sec);
    }
  });

  // cron
  // cron
eventos.forEach(evento => {
  evento.horas.forEach(hora => {

    const diasCron = evento.dias ? evento.dias.join(",") : "*";

    // 🔥 AVISOS PREVIOS
    if (evento.multiAviso) {

      [15, 10, 5].forEach(min => {
        const total = hora * 60 - min;
        const h = Math.floor((total + 1440) % 1440 / 60);
        const m = (total + 1440) % 60;

        cron.schedule(`${m} ${h} * * ${diasCron}`, () => {
          const msg = getMensajeEvento(evento.nombre, min);

          const embed = crearEmbed(
            evento.nombre,
            `${msg}\n\nComienza en ${min} minutos.`,
            min
          );

          channel.send({
            embeds: [embed]
          });

        }, {
          timezone: "America/Argentina/Buenos_Aires"
        });
      });

    } else {
      // ⏳ SOLO 5 MIN PARA EVENTOS NORMALES
      const hPrev = (hora - 1 + 24) % 24;

      cron.schedule(`55 ${hPrev} * * ${diasCron}`, () => {
        const msg = getMensajeEvento(evento.nombre, 5);

        const embed = crearEmbed(
          evento.nombre,
          `${msg}\n\nComienza en 5 minutos.`,
          5
        );

        channel.send({
          embeds: [embed]
        });

      }, {
        timezone: "America/Argentina/Buenos_Aires"
      });
    }

    // 🚨 INICIO (LO QUE YA TENÍAS)
    cron.schedule(`0 ${hora} * * ${diasCron}`, () => {

      let mensaje;

      if (evento.tipo === "ventana") {
        mensaje = "Los objetivos están disponibles en la ciudad.\nAprovechen mientras dure.";
      } else {
        mensaje = getMensajeEvento(evento.nombre, "activo");
      }

      const horaFin = getHoraFin(evento.nombre, hora);

let textoFinal = `${mensaje}\n\nYA DISPONIBLE.`;

if (horaFin !== null) {
  const ahora = new Date(
  new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
);
  const fechaFin = new Date(ahora);

  fechaFin.setHours(horaFin, 0, 0, 0);

  if (fechaFin <= ahora) {
    fechaFin.setDate(fechaFin.getDate() + 1);
  }

  const timestamp = Math.floor(fechaFin.getTime() / 1000);

  textoFinal += `\n🕒 Finaliza <t:${timestamp}:F> (<t:${timestamp}:R>)`;
}

const embed = crearEmbed(evento.nombre, textoFinal, "activo");

      channel.send({
        embeds: [embed]
      });

    }, {
      timezone: "America/Argentina/Buenos_Aires"
    });

  });
});

});

// =======================
// 🎯 INTERACCIONES
// =======================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // validar canal secuestro
  if (["newsecuestro", "revisado", "muerto", "secuestrados"].includes(interaction.commandName)) {
    if (interaction.channelId !== CANAL_SECUESTRADO_ID) {
      return interaction.reply({ content: "Usá el canal de secuestro.", ephemeral: true });
    }
  }

  if (interaction.commandName === "proximos") {

    const ahora = new Date(
  new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
);
    const lista = [];

    eventos.forEach(evento => {
      evento.horas.forEach(hora => {

        for (let i = 0; i < 7; i++) {
          const fecha = new Date(ahora);
          fecha.setDate(ahora.getDate() + i);
          fecha.setHours(hora, 0, 0, 0);

          if (evento.dias && !evento.dias.includes(fecha.getDay())) continue;
          if (i === 0 && fecha <= ahora) continue;

          lista.push({ fecha, nombre: evento.nombre });
          break;
        }
      });
    });

    lista.sort((a, b) => a.fecha - b.fecha);

   const texto = lista.slice(0,10).map(e => {

  const timestamp = Math.floor(e.fecha.getTime() / 1000);

  return `🕒 <t:${timestamp}:t> (<t:${timestamp}:R>) - ${e.nombre}`;

}).join("\n");

    const embed = new EmbedBuilder()
      .setColor("#00FFAA")
      .setTitle("⏳ Próximos eventos")
      .setDescription(texto)
      .setFooter({ text: "Sons Of The Road MC" })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "newsecuestro") {
    const data = cargarData();

    if (data.secuestrados.length >= 2) {
      return interaction.reply("Ya hay 2 secuestrados.");
    }

    const nuevo = {
      id: Date.now().toString().slice(-4),
      estado: "activo",
      listoEn: null
    };

    data.secuestrados.push(nuevo);
    guardarData(data);

    interaction.reply(`🔒 Nuevo secuestrado #${nuevo.id}`);
  }

  if (interaction.commandName === "revisado") {
    const id = interaction.options.getString("id");
    const data = cargarData();

    const sec = data.secuestrados.find(s => s.id == id);
    if (!sec) return interaction.reply("No existe.");

    sec.estado = "enfriamiento";
    sec.listoEn = Date.now() + (5 * 60 * 60 * 1000);

    guardarData(data);
    programarSecuestrado(client, sec);

    interaction.reply(`⏳ Secuestrado #${id} listo en 5h`);
  }

  if (interaction.commandName === "muerto") {
    const id = interaction.options.getString("id");
    let data = cargarData();

    data.secuestrados = data.secuestrados.filter(s => s.id != id);
    guardarData(data);

    interaction.reply(`☠️ Secuestrado #${id} eliminado`);
  }

  if (interaction.commandName === "secuestrados") {
    const data = cargarData();

    if (!data.secuestrados.length) {
      return interaction.reply("No hay secuestrados.");
    }

    const texto = data.secuestrados.map(s => {
      if (s.estado === "activo") return `#${s.id} → 🟢 Activo`;

      const restante = s.listoEn - Date.now();
      const h = Math.floor(restante / 3600000);
      const m = Math.floor((restante % 3600000) / 60000);

      return `#${s.id} → ⏳ ${h}h ${m}m`;
    }).join("\n");

    interaction.reply(`🔒 ESTADO\n\n${texto}`);
  }

  if (interaction.commandName === "help") {

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("💀 SONS OF THE ROAD MC")
    .setDescription(`
📅 **EVENTOS**
/proximos → Ver próximos eventos automáticos

🔒 **SECUESTROS**
/newsecuestro → Crear nuevo secuestrado
/revisado id → Poner en enfriamiento (5h)
/muerto id → Eliminar secuestrado
/secuestrados → Ver estado actual

📌 **IMPORTANTE**
Los comandos de secuestro se usan en su canal correspondiente.

⚙️ Sistema automático activo 24/7
    `)
    .setFooter({ text: "Usá los comandos con responsabilidad" })
    .setTimestamp();

  interaction.reply({ embeds: [embed], ephemeral: true });
}

});

client.login(TOKEN);