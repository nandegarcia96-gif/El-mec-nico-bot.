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

// 🤖 CLIENTE
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🔐 CANAL PERMITIDO
const ALLOWED_CHANNEL = "1519418226973347992";

// 🔐 ROLES
const TOKENS_ROLE = "1517347810167619697";
const PRISON_ROLE = "1459458843816759412";
const IMMUNITY_ROLE = "1515011976621854790";
const SHIELD_ROLE = "1449488332273877153";
const BOOSTER_ROLE = "1427099549364781127";
const EXTRA_ROLE = "1426678812443148430";

// 🛡️ INMUNIDADES
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 📦 MONGO SAFE (NO CRASH)
let RoleTimer = null;

try {
  if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log("📦 MongoDB conectado"))
      .catch(err => console.log("❌ Mongo error:", err));

    const roleTimerSchema = new mongoose.Schema({
      guildId: String,
      userId: String,
      roleId: String,
      expiresAt: Date
    });

    RoleTimer = mongoose.model("RoleTimer", roleTimerSchema);
  } else {
    throw new Error("No MONGO_URI");
  }
} catch (e) {
  console.log("⚠️ Mongo desactivado, usando memoria");

  const memory = [];

  RoleTimer = {
    async create(data) {
      memory.push(data);
    },
    async find(query) {
      const now = new Date();
      return memory.filter(x => x.expiresAt <= now);
    },
    async deleteOne(filter) {
      const i = memory.findIndex(x => x._id === filter._id);
      if (i !== -1) memory.splice(i, 1);
    },
    async deleteMany(filter) {
      for (let i = memory.length - 1; i >= 0; i--) {
        if (memory[i].userId === filter.userId && memory[i].roleId === filter.roleId) {
          memory.splice(i, 1);
        }
      }
    }
  };
}

const prefix = ">";
const cooldown = new Map();
const shopMessages = new Map();

// 🎲 NOMBRES
const randomNames = [
  "Sombra", "Fénix", "Rayo", "Titán", "Nómada",
  "Cazador", "Fantasma", "Vortex", "Draco", "Orion",
  "Lobo", "Ángel", "Demonio", "Neón", "Eco"
];

const originalNames = new Map();

// 🧠 TOKEN
async function consumeToken(member) {
  if (!member.roles.cache.has(TOKENS_ROLE)) return false;
  try {
    await member.roles.remove(TOKENS_ROLE);
    return true;
  } catch {
    return false;
  }
}

// 💾 TIMER ROLE
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

// 🧹 CHECK TIMERS
async function checkTimers() {
  try {
    const expired = await RoleTimer.find({});

    for (const t of expired) {
      const guild = await client.guilds.fetch(t.guildId).catch(() => null);
      if (!guild) continue;

      const member = await guild.members.fetch(t.userId).catch(() => null);
      if (member) await member.roles.remove(t.roleId).catch(() => {});

      await RoleTimer.deleteOne({ _id: t._id }).catch(() => {});
    }
  } catch {}
}

// 🟣 MESSAGE
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  const now = Date.now();
  if (cooldown.has(message.author.id) && now - cooldown.get(message.author.id) < 5000) return;
  cooldown.set(message.author.id, now);

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🤖 vuelve cuando tengas un token.");
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");
    await new Promise(r => setTimeout(r, 1200));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
`🔗 ENCANDENAMIENTO
🪙 1 TOKEN
⏳ 30 min
⚙️ bloquea acceso a interacciones básicas del sistema
🔗 efecto temporal de restricción de canales

⛓️ LIBERACIÓN
🪙 1 TOKEN
⚙️ elimina el efecto de encadenamiento
⛓️‍💥 restaura el acceso normal del usuario

✏️ RENOMBRAR USUARIO
🪙 1 TOKEN
⏳ 40 min
⚙️ cambia el nickname del usuario temporalmente
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
💿 cada 10–15 segundos cambia a un nombre

🛡️ INMUNIDAD CD
🪙 1 TOKEN
⏳ 1 HORA
⚙️ ignora el cooldown del servidor
💬 permite uso continuo de acciones

🛡️ ESCUDO
🪙 1 TOKEN
⏳ 1 HORA
⚙️ bloquea 1 acción recibida del sistema
🛡️ protege contra un efecto`
      )
      .setColor(0x8b5cf6)
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
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" },
          { label: "Escudo", value: "shield", emoji: "🛡️" },
          { label: "Permisos Extras", value: "extras", emoji: "🔓" },
          { label: "Cerrar", value: "close", emoji: "❌" }
        ])
    );

    await loading.edit({ embeds: [embed], components: [menu] });

    shopMessages.set(message.author.id, loading.id);
  }
});

// 🟣 INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {

  // CLOSE SHOP
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

  // ACTIONS
  if (interaction.isUserSelectMenu()) {

    const action = interaction.customId.split("_")[1];
    const target = await interaction.guild.members.fetch(interaction.values[0]).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    let success = false;

    // ⛓ 5 MIN
    if (action === "chain") {
      await addRoleTimer(target, PRISON_ROLE, 5 * 60000);
      success = true;
    }

    // 🛡
    if (action === "immunity") {
      await addRoleTimer(target, IMMUNITY_ROLE, 60 * 60000);
      success = true;
    }

    if (action === "shield") {
      await addRoleTimer(target, SHIELD_ROLE, 60 * 60000);
      success = true;
    }

    if (action === "extras") {
      await addRoleTimer(target, EXTRA_ROLE, 60 * 60000);
      success = true;
    }

    // ✏️ 1 MIN RESTORE
    if (action === "rename") {
      const old = target.nickname || target.user.username;
      await target.setNickname("TEMP");

      setTimeout(() => {
        target.setNickname(old).catch(() => {});
      }, 60000);

      success = true;
    }

    // 🎲 1 MIN RESTORE
    if (action === "randomname") {
      const old = target.nickname || target.user.username;

      const interval = setInterval(async () => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        await target.setNickname(name).catch(() => {});
      }, 15000);

      setTimeout(() => {
        clearInterval(interval);
        target.setNickname(old).catch(() => {});
      }, 60000);

      success = true;
    }

    // RELEASE
    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      success = true;
    }

    // 💰 TOKEN LAST STEP + CLOSE SHOP
    if (success) {
      const ok = await consumeToken(buyer);
      if (!ok) return interaction.reply({ content: "❌ sin token", ephemeral: true });

      const shopId = shopMessages.get(buyer.id);
      if (shopId) {
        const msg = await interaction.channel.messages.fetch(shopId).catch(() => null);
        if (msg) await msg.edit({ components: [], embeds: [], content: "🟣 compra completada" }).catch(() => {});
      }

      return interaction.update({ content: "ok", components: [], embeds: [] });
    }
  }
});

// 🚀 READY
client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
  setInterval(checkTimers, 60000);
});

client.login(process.env.TOKEN);
