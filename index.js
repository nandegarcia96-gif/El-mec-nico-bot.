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
const SHIELD_ROLE = "1449488332273877153"; // ✅ FIX REAL

// 🛡️ INMUNIDADES
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 📡 LOG CHANNEL (nuevo)
const LOG_CHANNEL = "1519438831479427192";

// 📦 MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

const prefix = ">";

// ⏱️ COOLDOWN (nuevo anti spam)
const cooldown = new Map();

// ─────────────────────────────
// 🤖 MESSAGE SYSTEM
// ─────────────────────────────
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  // ⏱️ anti spam tienda
  const now = Date.now();
  const cd = cooldown.get(message.author.id) || 0;

  if (now - cd < 5000) return; // 5s cooldown
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
        "🧷 ENCANDENAMIENTO\n🪙 1 TOKEN\n⏳ 30 min\n⚙️ encierra a un usuario\n\n" +
        "⛓️ LIBERACIÓN\n🪙 1 TOKEN\n⚙️ elimina prisión\n\n" +
        "✏️ RENOMBRAR USUARIO\n🪙 1 TOKEN\n⏳ 40 min\n⚙️ nickname temporal\n\n" +
        "🛡️ INMUNIDAD CD\n🪙 1 TOKEN\n⏳ 1 HORA\n⚙️ ignora cooldown\n\n" +
        "🛡️ ESCUDO\n🪙 1 TOKEN\n⏳ 1 HORA\n⚙️ bloquea 1 ataque\n" +
        "```"
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
        "🧷 ENCANDENAMIENTO → 30m prisión\n" +
        "⛓️ LIBERACIÓN → elimina prisión\n" +
        "✏️ RENOMBRAR → nickname 40m\n" +
        "🛡️ INMUNIDAD CD → cooldown bypass\n" +
        "🛡️ ESCUDO → bloquea ataque\n\n" +
        "⚠️ sistema estable\n" +
        "```"
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

  // ───────── SHOP ─────────
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

    const immune = IMMUNE_ROLES.some(r => target.roles.cache.has(r));

    if (action === "chain") {
      if (immune) return interaction.reply({ content: "inmune", ephemeral: true });

      await target.roles.add(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(() => {
        target.roles.remove(PRISON_ROLE).catch(() => {});
      }, 30 * 60 * 1000);

      return interaction.reply({ content: "encadenado", ephemeral: true });
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);
      return interaction.reply({ content: "liberado", ephemeral: true });
    }

    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(() => {
        target.roles.remove(IMMUNITY_ROLE).catch(() => {});
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "inmunidad", ephemeral: true });
    }

    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(() => {
        target.roles.remove(SHIELD_ROLE).catch(() => {});
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "escudo", ephemeral: true });
    }

    // ✏️ RENAMER FIXED (buyer guardado bien)
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

    // 📡 LOG
    const log = interaction.guild.channels.cache.get(LOG_CHANNEL);
    if (log) {
      log.send(`✏️ ${buyer.user.tag} cambió el nombre de ${target.user.tag} a **${newName}**`);
    }

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
