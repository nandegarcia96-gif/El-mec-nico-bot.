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

// 📦 MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

// 📌 SCHEMA TIMERS
const roleTimerSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  roleId: String,
  expiresAt: Date
});

const RoleTimer = mongoose.model("RoleTimer", roleTimerSchema);

const prefix = ">";
const cooldown = new Map();

const randomNames = [
  "Sombra", "Fénix", "Rayo", "Titán", "Nómada",
  "Cazador", "Fantasma", "Vortex", "Draco", "Orion",
  "Lobo", "Ángel", "Demonio", "Neón", "Eco"
];

const originalNames = new Map();

// 🧠 TOKEN CONSUMER (AL FINAL)
async function consumeToken(member) {
  if (!member.roles.cache.has(TOKENS_ROLE)) return false;
  try {
    await member.roles.remove(TOKENS_ROLE);
    return true;
  } catch {
    return false;
  }
}

// 💾 ADD ROLE TIMER
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
  const now = new Date();

  const expired = await RoleTimer.find({
    expiresAt: { $lte: now }
  });

  for (const t of expired) {
    try {
      const guild = await client.guilds.fetch(t.guildId);
      const member = await guild.members.fetch(t.userId).catch(() => null);

      if (member) {
        await member.roles.remove(t.roleId).catch(() => {});
      }

      await RoleTimer.deleteOne({ _id: t._id });
    } catch {}
  }
}

// 🟣 MESSAGE SYSTEM
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  const now = Date.now();
  const cd = cooldown.get(message.author.id) || 0;

  if (now - cd < 5000) return;
  cooldown.set(message.author.id, now);

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // 🛒 TIENDA
  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🤖 vuelve cuando tengas un token.");
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
`🔗 ENCANDENAMIENTO
🪙 1 TOKEN
⏳ 5 MIN

⚙️ bloquea al usuario con el rol de prisión

⛓️ LIBERACIÓN
🪙 1 TOKEN
⚙️ elimina el efecto de encadenamiento

✏️ RENOMBRAR USUARIO
🪙 1 TOKEN
⏳ 1 MIN
⚙️ cambia el nickname del usuario temporalmente
✨ vuelve al nombre original al finalizar

🎲 NOMBRES ALEATORIOS
🪙 1 TOKEN
⏳ 1 MIN
⚙️ cambia el nombre del usuario constantemente
💿 cada 10–15 segundos cambia a un nombre

🛠️ PERMISOS EXTRAS
🪙 1 TOKEN
⏳ 1 HORA
⚙️ permisos temporales avanzados
💬 links, archivos, nombre y VC

🛡️ INMUNIDAD CD
🪙 1 TOKEN
⏳ 1 HORA
⚙️ ignora el cooldown del servidor

🛡️ ESCUDO
🪙 1 TOKEN
⏳ 1 HORA
⚙️ bloquea 1 acción recibida del sistema`
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: "🤖 MECHANIC SYSTEM ONLINE" });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("seleccionar módulo")
        .addOptions([
          { label: "Encadenar", value: "chain", emoji: "⛓️" },
          { label: "Liberación", value: "release", emoji: "💥" },
          { label: "Renombrar", value: "rename", emoji: "✏️" },
          { label: "Random Name", value: "randomname", emoji: "🎲" },
          { label: "Inmunidad", value: "immunity", emoji: "🛡️" },
          { label: "Escudo", value: "shield", emoji: "🛡️" },
          { label: "Extras", value: "extras", emoji: "🔓" },
          { label: "Cerrar", value: "close", emoji: "❌" }
        ])
    );

    const shopMsg = await loading.edit({ embeds: [embed], components: [menu] });
    client.shopMessageId = shopMsg.id;
  }
});

// 🟣 INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {

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

  if (!interaction.isUserSelectMenu() && !interaction.isModalSubmit()) return;

  if (interaction.isUserSelectMenu()) {

    const action = interaction.customId.split("_")[1];
    const target = await interaction.guild.members.fetch(interaction.values[0]).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    let success = false;

    // ⛓ 5 MIN
    if (action === "chain") {
      await addRoleTimer(target, PRISON_ROLE, 5 * 60 * 1000);
      success = true;
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await RoleTimer.deleteMany({ userId: target.id, roleId: PRISON_ROLE });
      success = true;
    }

    if (action === "immunity") {
      await addRoleTimer(target, IMMUNITY_ROLE, 60 * 60 * 1000);
      success = true;
    }

    if (action === "shield") {
      await addRoleTimer(target, SHIELD_ROLE, 60 * 60 * 1000);
      success = true;
    }

    if (action === "extras") {
      await addRoleTimer(target, EXTRA_ROLE, 60 * 60 * 1000);
      success = true;
    }

    // ✏️ RENOMBRAR 1 MIN
    if (action === "rename") {
      const old = target.nickname || target.user.username;
      originalNames.set(target.id, old);

      const modal = new ModalBuilder()
        .setCustomId(`rename_${target.id}`)
        .setTitle("renombrar usuario");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("nuevo nombre")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      setTimeout(() => {
        const original = originalNames.get(target.id);
        if (original && target.manageable) {
          target.setNickname(original).catch(() => {});
        }
        originalNames.delete(target.id);
      }, 60000);

      return interaction.showModal(modal);
    }

    // 🎲 RANDOM 1 MIN
    if (action === "randomname") {

      const old = target.nickname || target.user.username;
      originalNames.set(target.id, old);

      let i = 0;
      const interval = setInterval(async () => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        if (target.manageable) await target.setNickname(name).catch(() => {});
        if (++i >= 3) clearInterval(interval);
      }, 20000);

      setTimeout(async () => {
        const original = originalNames.get(target.id);
        if (original && target.manageable) {
          await target.setNickname(original).catch(() => {});
        }
        originalNames.delete(target.id);
      }, 60000);

      success = true;
    }

    // 🧠 TOKEN AL FINAL + CIERRE TIENDA
    if (success) {
      const ok = await consumeToken(buyer);

      if (!ok) return interaction.reply({ content: "❌ no tenías token", ephemeral: true });

      await interaction.update({
        content: "🟣 compra completada correctamente",
        embeds: [],
        components: []
      });

      if (client.shopMessageId) {
        try {
          const msg = await interaction.channel.messages.fetch(client.shopMessageId);
          setTimeout(() => msg.delete().catch(() => {}), 2000);
        } catch {}
      }
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("rename_")) {

    const targetId = interaction.customId.split("_")[1];
    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    const newName = interaction.fields.getTextInputValue("new_name");
    const old = target.nickname || target.user.username;

    if (target.manageable) {
      await target.setNickname(newName).catch(() => {});
    }

    setTimeout(() => {
      if (target.manageable) {
        target.setNickname(old).catch(() => {});
      }
    }, 60000);

    const ok = await consumeToken(buyer);
    if (!ok) return interaction.reply({ content: "❌ no tenías token", ephemeral: true });

    return interaction.reply({ content: "cambiado", ephemeral: true });
  }
});

// 🚀 START
client.once(Events.ClientReady, async () => {
  console.log("🤖 mechanic online");
  await checkTimers();
  setInterval(checkTimers, 60000);
});

client.login(process.env.TOKEN);
