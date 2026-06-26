const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const mongoose = require("mongoose");

// 🧠 ANTI CRASH
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

// 🤖 CLIENTE
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🔐 CONFIG
const ALLOWED_CHANNEL = "1519418226973347992";

const TOKENS_ROLE = "1517347810167619697";
const PRISON_ROLE = "1459458843816759412";
const IMMUNITY_ROLE = "1515011976621854790";
const SHIELD_ROLE = "1449488332273877153";
const EXTRA_ROLE = "1426678812443148430";

const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 🔥 MONGO SAFE CONNECT
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("📦 MongoDB conectado"))
    .catch(err => console.log("❌ Mongo error:", err));
} else {
  console.log("❌ MONGO_URI no definida");
}

// 📌 SCHEMA
const roleTimerSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  roleId: String,
  expiresAt: Date
});

const RoleTimer = mongoose.model("RoleTimer", roleTimerSchema);

// 💾 MEMORY
const cooldown = new Map();
const originalNames = new Map();
const shopMessages = new Map();

const randomNames = [
  "Sombra", "Fénix", "Rayo", "Titán", "Nómada",
  "Cazador", "Fantasma", "Vortex", "Draco", "Orion",
  "Lobo", "Ángel", "Demonio", "Neón", "Eco"
];

// 🔥 TOKEN (AL FINAL)
async function consumeToken(member) {
  try {
    if (!member.roles.cache.has(TOKENS_ROLE)) return false;
    await member.roles.remove(TOKENS_ROLE);
    return true;
  } catch {
    return false;
  }
}

// 💾 TIMER SYSTEM
async function addRoleTimer(member, roleId, ms) {
  const expiresAt = new Date(Date.now() + ms);

  await RoleTimer.create({
    guildId: member.guild.id,
    userId: member.id,
    roleId,
    expiresAt
  });

  await member.roles.add(roleId);
}

// 🧹 CLEAN TIMERS
async function checkTimers() {
  try {
    const now = new Date();

    const expired = await RoleTimer.find({
      expiresAt: { $lte: now }
    });

    for (const t of expired) {
      const guild = await client.guilds.fetch(t.guildId);
      const member = await guild.members.fetch(t.userId).catch(() => null);

      if (member) {
        await member.roles.remove(t.roleId).catch(() => {});
      }

      await RoleTimer.deleteOne({ _id: t._id });
    }
  } catch (e) {
    console.log(e);
  }
}

// 🟣 MESSAGE SYSTEM
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== ALLOWED_CHANNEL) return;

    if (!message.content.startsWith(">")) return;

    const args = message.content.slice(1).trim().split(/ +/);

    if (args[0] === "call" && args[1] === "mechanic") {

      if (!message.member.roles.cache.has(TOKENS_ROLE)) {
        return message.reply("🤖 vuelve cuando tengas un token.");
      }

      const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");

      const embed = new EmbedBuilder()
        .setTitle("🛒 ⚙️ THE MECHANIC STORE")
        .setDescription(
`\
\`\`\`yaml

🔗 ENCANDENAMIENTO
🪙 1 TOKEN
⏳ 30 min
⚙️ bloquea acceso a interacciones básicas del sistema
🔗 efecto temporal de restricción de canales

⛓️ LIBERACIÓN
🪙 1 TOKEN
⚙️ elimina efecto de encadenamiento
⛓️‍💥 restaura acceso normal del usuario

✏️ RENOMBRAR USUARIO
🪙 1 TOKEN
⏳ 40 min
⚙️ cambia nickname temporalmente
✨ vuelve al nombre original al finalizar

🛠️ PERMISOS EXTRAS
🪙 1 TOKEN
⏳ 1 HORA
⚙️ permisos temporales avanzados
💬 links, archivos, nombre y VC

🎲 NOMBRES ALEATORIOS
🪙 1 TOKEN
⏳ 1 min
⚙️ cambia el nombre del usuario constantemente
💿 cada 10–15 segundos cambia

🛡️ INMUNIDAD CD
🪙 1 TOKEN
⏳ 1 HORA
⚙️ ignora cooldown del servidor
💬 uso continuo de acciones

🛡️ ESCUDO
🪙 1 TOKEN
⏳ 1 HORA
⚙️ bloquea 1 acción del sistema
🛡️ protección temporal

\`\`\`
`
        )
        .setColor(0x8b5cf6)
        .setImage("https://cdn.discordapp.com/attachments/1402268718360297544/1519443095379513496/E42BDE84-B055-4A1C-B788-620B7DC904AD.gif")
        .setFooter({ text: "🤖 MECHANIC SYSTEM ONLINE" });

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("shop_menu")
          .setPlaceholder("seleccionar módulo")
          .addOptions([
            { label: "Encadenar", value: "chain", emoji: "🧷" },
            { label: "Liberación", value: "release", emoji: "⛓️‍💥" },
            { label: "Renombrar", value: "rename", emoji: "✏️" },
            { label: "Random Name", value: "randomname", emoji: "🎲" },
            { label: "Extras", value: "extras", emoji: "🔓" },
            { label: "Cerrar", value: "close", emoji: "❌" }
          ])
      );

      const shopMsg = await loading.edit({
        embeds: [embed],
        components: [menu]
      });

      shopMessages.set(message.author.id, shopMsg);
    }
  } catch (e) {
    console.log(e);
  }
});

// 🟣 INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {
  try {

    if (interaction.isStringSelectMenu() && interaction.customId === "shop_menu") {

      if (interaction.values[0] === "close") {
        return interaction.update({ content: "cerrado", embeds: [], components: [] });
      }

      return interaction.reply({
        content: "elige usuario:",
        ephemeral: true,
        components: [
          new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId(`user_${interaction.values[0]}`)
              .setMaxValues(1)
          )
        ]
      });
    }

    if (interaction.isUserSelectMenu()) {

      await interaction.deferReply({ ephemeral: true });

      const action = interaction.customId.split("_")[1];
      const target = await interaction.guild.members.fetch(interaction.values[0]);

      let success = false;

      if (action === "chain") {
        await addRoleTimer(target, PRISON_ROLE, 30 * 60000);
        success = true;
      }

      if (action === "release") {
        await target.roles.remove(PRISON_ROLE);
        await RoleTimer.deleteMany({ userId: target.id, roleId: PRISON_ROLE });
        success = true;
      }

      if (action === "extras") {
        await addRoleTimer(target, EXTRA_ROLE, 60 * 60000);
        success = true;
      }

      if (action === "randomname") {
        const old = target.nickname || target.user.username;

        if (!originalNames.has(target.id)) {
          originalNames.set(target.id, old);
        }

        setTimeout(async () => {
          const original = originalNames.get(target.id);
          if (target.manageable) await target.setNickname(original);
          originalNames.delete(target.id);
        }, 60000);

        success = true;
      }

      // 🔥 CIERRE TIENDA + TOKEN FINAL
      if (success) {

        const shopMsg = shopMessages.get(interaction.member.id);

        if (shopMsg) {
          await shopMsg.edit({
            content: "🟣 tienda cerrada",
            embeds: [],
            components: []
          });

          shopMessages.delete(interaction.member.id);
        }

        await consumeToken(interaction.member);

        return interaction.editReply({
          content: "🟣 compra completada correctamente",
          components: []
        });
      }
    }

  } catch (e) {
    console.log(e);
  }
});

// 🚀 START
client.once(Events.ClientReady, async () => {
  console.log("🤖 mechanic online");

  await checkTimers();
  setInterval(checkTimers, 60000);
});

client.login(process.env.TOKEN);
