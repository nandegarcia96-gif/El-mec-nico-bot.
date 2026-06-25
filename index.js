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

// ⏱️ COOLDOWN
const cooldown = new Map();

// 🎲 NOMBRES ALEATORIOS (ESPAÑOL)
const randomNamesES = [
  "Sombra Roja", "Lobo Gris", "Fénix Azul", "Rayo Negro",
  "Guerrero Dorado", "Ángel Caído", "Víbora Real", "Tigre Blanco",
  "Nómada Oscuro", "Caballero Lunar", "Explorador Ámbar", "Asesino Silente",
  "Eco Perdido", "Sable Carmesí", "Tormenta Blanca", "Sombras del Norte"
];

// ─────────────────────────────
// 🤖 MESSAGE SYSTEM
// ─────────────────────────────
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  // ⏱️ anti spam simple
  const now = Date.now();
  const last = cooldown.get(message.author.id) || 0;

  if (now - last < 5000) return;
  cooldown.set(message.author.id, now);

  if (message.mentions.has(client.user)) {
    return message.reply("🤖 vuelve cuando tengas un token.");
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // ─────────────────────────────
  // 🛒 TIENDA
  // ─────────────────────────────
  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🤖 vuelve cuando tengas un token.");
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");
    await new Promise(r => setTimeout(r, 1200));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +
        "🧷 ENCANDENAMIENTO\n🪙 1 TOKEN\n⏳ 30 min\n\n" +
        "⛓️ LIBERACIÓN\n🪙 1 TOKEN\n\n" +
        "✏️ RENOMBRAR USUARIO\n🪙 1 TOKEN\n⏳ 40 min\n\n" +
        "🎲 NOMBRES ALEATORIOS\n🪙 1 TOKEN\n⏳ 1 min\n\n" +
        "🛡️ INMUNIDAD CD\n🪙 1 TOKEN\n\n" +
        "🛡️ ESCUDO\n🪙 1 TOKEN\n```"
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
          { label: "Nombres aleatorios", value: "randomname", emoji: "🎲" },
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" },
          { label: "Escudo", value: "shield", emoji: "🛡️" },
          { label: "Cerrar", value: "close", emoji: "❌" }
        ])
    );

    await loading.edit({ embeds: [embed], components: [menu] });
  }

  // ─────────────────────────────
  // 📘 HELP
  // ─────────────────────────────
  if (args[0] === "mechanic" && args[1] === "help") {

    const embed = new EmbedBuilder()
      .setTitle("🤖 ⚙️ MECHANIC GUIDE")
      .setColor(0x8b5cf6)
      .setDescription(
        "```yaml\n" +
        ">call mechanic\n>mechanic help\n\n" +
        "🪙 TOKENS → moneda\n" +
        "🧷 ENCANDENAMIENTO → 30m\n" +
        "⛓️ LIBERACIÓN → elimina prisión\n" +
        "✏️ RENOMBRAR → nickname\n" +
        "🎲 ALEATORIOS → 1 min\n" +
        "🛡️ INMUNIDAD → bypass\n" +
        "🛡️ ESCUDO → bloquea\n```"
      )
      .setFooter({ text: "GUIDE SYSTEM" });

    return message.channel.send({ embeds: [embed] });
  }
});

// ─────────────────────────────
// ⚡ INTERACTIONS
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isStringSelectMenu() &&
      !interaction.isUserSelectMenu() &&
      !interaction.isModalSubmit()) return;

  // ───────── SHOP MENU ─────────
  if (interaction.isStringSelectMenu() && interaction.customId === "shop_menu") {

    const option = interaction.values[0];

    if (option === "close") {
      return interaction.update({
        content: "🤖 cerrado",
        embeds: [],
        components: []
      });
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

    if (isBooster && (action === "rename" || action === "randomname")) {
      return interaction.reply({
        content: "🚫 no puedes afectar a boosters",
        ephemeral: true
      });
    }

    // ───── CHAIN ─────
    if (action === "chain") {
      if (immune) return interaction.reply({ content: "inmune", ephemeral: true });

      await target.roles.add(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(() => {
        target.roles.remove(PRISON_ROLE).catch(() => {});
      }, 30 * 60 * 1000);

      return interaction.reply({ content: "encadenado", ephemeral: true });
    }

    // ───── RELEASE ─────
    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);
      return interaction.reply({ content: "liberado", ephemeral: true });
    }

    // ───── IMMUNITY ─────
    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(() => {
        target.roles.remove(IMMUNITY_ROLE).catch(() => {});
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "inmunidad", ephemeral: true });
    }

    // ───── SHIELD ─────
    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(() => {
        target.roles.remove(SHIELD_ROLE).catch(() => {});
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "escudo", ephemeral: true });
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

    // ───── RANDOM NAME ─────
    if (action === "randomname") {

      const old = target.nickname || target.user.username;
      const random = randomNamesES[Math.floor(Math.random() * randomNamesES.length)];

      await target.setNickname(random);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try {
          await target.setNickname(old);
        } catch {}
      }, 60 * 1000);

      return interaction.reply({
        content: `🎲 nombre cambiado a **${random}**`,
        ephemeral: true
      });
    }
  }

  // ───────── MODAL ─────────
  if (interaction.isModalSubmit() && interaction.customId.startsWith("rename_")) {

    const targetId = interaction.customId.split("_")[1];
    const newName = interaction.fields.getTextInputValue("new_name");

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    const buyer = interaction.member;

    if (!target) {
      return interaction.reply({ content: "usuario no encontrado", ephemeral: true });
    }

    const old = target.nickname || target.user.username;

    await target.setNickname(newName);
    await buyer.roles.remove(TOKENS_ROLE);

    setTimeout(() => {
      target.setNickname(old).catch(() => {});
    }, 40 * 60 * 1000);

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
