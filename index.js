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

// 🛡️ INMUNIDADES
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 📡 LOG CHANNEL
const LOG_CHANNEL = "1519438831479427192";

// 📦 MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

const prefix = ">";

// ⏱️ COOLDOWN GLOBAL
const cooldown = new Map();

// ⏱️ TOKENS LIMIT (3 por hora)
const tokenUsage = new Map();

// 🎲 nombres random
const randomNames = [
  "Sombra", "Fénix", "Lobo", "Rayo", "Víbora",
  "Tigre", "Ángel", "Demonio", "Nómada", "Titan",
  "Ghost", "Rey", "Caos", "Zero", "Nova"
];

// ─────────────────────────────
// 🤖 MESSAGE SYSTEM
// ─────────────────────────────
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  const now = Date.now();
  const cd = cooldown.get(message.author.id) || 0;

  if (now - cd < 5000) return;
  cooldown.set(message.author.id, now);

  if (message.mentions.has(client.user)) {
    return message.reply("🤖 vuelve cuando tengas un token.");
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // 🛒 TIENDA
  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🚫 No tienes tokens para acceder a la tienda.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +
        "🧷 ENCANDENAMIENTO\n🪙 1 TOKEN\n⏳ 30 min\n⚙️ Encierra a un usuario en prisión\n\n" +
        "⛓️ LIBERACIÓN\n🪙 1 TOKEN\n⚙️ Libera a un usuario de prisión\n\n" +
        "✏️ RENOMBRAR USUARIO\n🪙 1 TOKEN\n⏳ 40 min\n⚙️ Cambia el nickname temporalmente\n\n" +
        "🎲 NOMBRES ALEATORIOS\n🪙 1 TOKEN\n⏳ 1 min\n⚙️ Cambia el nombre continuamente\n\n" +
        "🛡️ INMUNIDAD CD\n🪙 1 TOKEN\n⏳ 1 HORA\n⚙️ Ignora cooldown\n\n" +
        "🛡️ ESCUDO\n🪙 1 TOKEN\n⏳ 1 HORA\n⚙️ Bloquea un ataque\n" +
        "```"
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
          { label: "Nombres aleatorios", value: "random", emoji: "🎲" },
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" },
          { label: "Escudo", value: "shield", emoji: "🛡️" },
          { label: "Cerrar", value: "close", emoji: "❌" }
        ])
    );

    await message.channel.send({ embeds: [embed], components: [menu] });
  }
});

// ─────────────────────────────
// ⚡ INTERACTIONS
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isStringSelectMenu() &&
      !interaction.isUserSelectMenu() &&
      !interaction.isModalSubmit()) return;

  // 🛑 BLOQUEO SI NO TIENE TOKEN
  if (interaction.member && !interaction.member.roles.cache.has(TOKENS_ROLE)) {
    return interaction.reply({
      content: "🚫 necesitas token para usar esto",
      ephemeral: true
    });
  }

  // ───────── MENU ─────────
  if (interaction.isStringSelectMenu() && interaction.customId === "shop_menu") {

    const option = interaction.values[0];

    if (option === "close") {
      return interaction.update({ content: "cerrado", components: [], embeds: [] });
    }

    return interaction.reply({
      content: "elige usuario:",
      components: [
        new ActionRowBuilder().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId(`user_${option}`)
            .setPlaceholder("selecciona usuario")
            .setMaxValues(1)
        )
      ],
      ephemeral: true
    });
  }

  // ───────── USER SELECT ─────────
  if (interaction.isUserSelectMenu()) {

    const action = interaction.customId.split("_")[1];
    const targetId = interaction.values[0];

    const guild = interaction.guild;
    const target = await guild.members.fetch(targetId).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    const isBooster = target.roles.cache.has(BOOSTER_ROLE);
    const immune = IMMUNE_ROLES.some(r => target.roles.cache.has(r));

    if (isBooster && action === "rename") {
      return interaction.reply({
        content: "🚫 no puedes afectar a boosters",
        ephemeral: true
      });
    }

    // ───── TOKEN LIMIT ─────
    const now = Date.now();
    const userData = tokenUsage.get(buyer.id) || { count: 0, reset: now + 3600000 };

    if (now > userData.reset) {
      userData.count = 0;
      userData.reset = now + 3600000;
    }

    if (userData.count >= 3) {
      return interaction.reply({
        content: "🚫 límite de tokens (3 por hora)",
        ephemeral: true
      });
    }

    userData.count++;
    tokenUsage.set(buyer.id, userData);

    // ───── ACTIONS ─────
    if (action === "chain") {
      if (immune) return interaction.reply({ content: "inmune", ephemeral: true });

      await target.roles.add(PRISON_ROLE);
      setTimeout(() => target.roles.remove(PRISON_ROLE).catch(() => {}), 30 * 60000);

      return interaction.reply({ content: "encadenado", ephemeral: true });
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      return interaction.reply({ content: "liberado", ephemeral: true });
    }

    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      setTimeout(() => target.roles.remove(IMMUNITY_ROLE).catch(() => {}), 60 * 60000);
      return interaction.reply({ content: "inmunidad", ephemeral: true });
    }

    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      setTimeout(() => target.roles.remove(SHIELD_ROLE).catch(() => {}), 60 * 60000);
      return interaction.reply({ content: "escudo", ephemeral: true });
    }

    // ───── RANDOM NAMES LOOP ─────
    if (action === "random") {

      const old = target.nickname || target.user.username;
      let i = 0;

      const interval = setInterval(async () => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        try {
          await target.setNickname(name);
        } catch {}
        i++;
        if (i >= 3) clearInterval(interval);
      }, 20000);

      setTimeout(() => {
        target.setNickname(old).catch(() => {});
      }, 60000);

      return interaction.reply({
        content: "🎲 nombres aleatorios activados",
        ephemeral: true
      });
    }

    // ───── RENAMER ─────
    if (action === "rename") {

      const modal = new ModalBuilder()
        .setCustomId(`rename_${targetId}`)
        .setTitle("renombrar usuario");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("nuevo nombre")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }
  }

  // ───────── MODAL ─────────
  if (interaction.isModalSubmit() && interaction.customId.startsWith("rename_")) {

    const targetId = interaction.customId.split("_")[1];
    const newName = interaction.fields.getTextInputValue("new_name");

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    const old = target.nickname || target.user.username;

    await target.setNickname(newName);

    setTimeout(() => {
      target.setNickname(old).catch(() => {});
    }, 40 * 60000);

    return interaction.reply({
      content: `✏️ cambiado a **${newName}**`,
      ephemeral: true
    });
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
});

client.login(process.env.TOKEN);
