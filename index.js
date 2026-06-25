const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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
const SHIELD_ROLE = "ID_DEL_ROL_ESCUDO";

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

const prefix = ">";

// ─────────────────────────────
// 🤖 MESSAGE HANDLER
// ─────────────────────────────
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  if (message.mentions.has(client.user)) {
    return message.reply(
      "🤖 Parece que no tengo ningún motivo para ayudarte.\n" +
      "vuelve cuando tengas un token o algo de mi interés."
    );
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // ───────── TIENDA ─────────
  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🤖 vuelve cuando tengas un token.");
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");
    await new Promise(r => setTimeout(r, 2000));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +

        "🧷 ENCANDENAMIENTO\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⏳ DURACIÓN: 30 min\n" +
        "⚙️ EFECTO: Encierra a un usuario en prisión\n\n" +

        "⛓️ LIBERACIÓN\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⚙️ EFECTO: Elimina la prisión de un usuario\n\n" +

        "✏️ RENOMBRAR USUARIO\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⏳ DURACIÓN: 40 min\n" +
        "⚙️ EFECTO: Cambia nickname temporalmente\n\n" +

        "🛡️ INMUNIDAD CD\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⏳ DURACIÓN: 1 HORA\n" +
        "⚙️ EFECTO: Ignora cooldown del sistema\n\n" +

        "🛡️ ESCUDO [1 IMPACTO]\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⏳ DURACIÓN: 1 HORA\n" +
        "⚙️ EFECTO: Bloquea el primer ataque\n\n" +

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
          { label: "Cerrar tienda", value: "close", emoji: "❌" }
        ])
    );

    await loading.edit({ content: "", embeds: [embed], components: [menu] });
  }

  // ───────── HELP ─────────
  if (args[0] === "mechanic" && args[1] === "help") {

    const embed = new EmbedBuilder()
      .setTitle("🤖 ⚙️ MECHANIC SYSTEM GUIDE")
      .setColor(0x8b5cf6)
      .setDescription(
        "```yaml\n" +

        "📌 COMANDOS\n" +
        ">call mechanic → abre la tienda\n" +
        ">mechanic help → guía del sistema\n\n" +

        "🪙 TOKENS\n" +
        "Moneda del sistema usada para comprar ítems.\n\n" +

        "🧷 ENCANDENAMIENTO\n" +
        "Prisión de 30 minutos a un usuario.\n\n" +

        "⛓️ LIBERACIÓN\n" +
        "Elimina prisión inmediatamente.\n\n" +

        "✏️ RENOMBRAR\n" +
        "Cambia nickname temporalmente.\n\n" +

        "🛡️ INMUNIDAD CD\n" +
        "Ignora cooldown del sistema por 1 hora.\n\n" +

        "🛡️ ESCUDO\n" +
        "Bloquea un ataque y se consume.\n\n" +

        "📡 SISTEMA\n" +
        "Sistema estable y en funcionamiento.\n\n" +

        "⚠️ AVISO\n" +
        "La tienda está sujeta a cambios próximamente.\n" +

        "```"
      )
      .setFooter({ text: "🤖 MECHANIC GUIDE SYSTEM" });

    return message.channel.send({ embeds: [embed] });
  }
});

// ─────────────────────────────
// ⚡ INTERACTIONS
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ───────── SHOP MENU ─────────
  if (interaction.isStringSelectMenu() && interaction.customId === "shop_menu") {

    const option = interaction.values[0];

    if (option === "close") {
      await interaction.update({
        content: "🤖 cerrando sistema...",
        embeds: [],
        components: []
      });
      return interaction.deleteReply();
    }

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`user_${option}`)
        .setPlaceholder("selecciona usuario")
        .addOptions([{ label: "Seleccionar usuario", value: "pick", emoji: "👤" }])
    );

    return interaction.reply({
      content: "👤 selecciona usuario:",
      components: [menu],
      ephemeral: true
    });
  }

  // ───────── USER SELECT ─────────
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("user_")) {

    const action = interaction.customId.split("_")[1];
    const targetId = interaction.values[0];

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (!target) return interaction.reply({ content: "usuario no encontrado", ephemeral: true });

    const isImmune = IMMUNE_ROLES.some(r => target.roles.cache.has(r));

    if (action === "chain") {

      if (isImmune) return interaction.reply({ content: "🤖 inmune", ephemeral: true });

      await target.roles.add(PRISON_ROLE);
      await interaction.member.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(PRISON_ROLE); } catch {}
      }, 30 * 60 * 1000);

      return interaction.reply({ content: "🧷 encadenado", ephemeral: true });
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await interaction.member.roles.remove(TOKENS_ROLE);
      return interaction.reply({ content: "⛓️ liberado", ephemeral: true });
    }

    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      await interaction.member.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(IMMUNITY_ROLE); } catch {}
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "🛡️ inmunidad activada", ephemeral: true });
    }

    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      await interaction.member.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(SHIELD_ROLE); } catch {}
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "🛡️ escudo activado", ephemeral: true });
    }

    // ───────── RENAMING PANEL ─────────
    if (action === "rename") {

      const modal = new ModalBuilder()
        .setCustomId("rename_modal")
        .setTitle("✏️ Panel de Renombrado");

      const userInput = new TextInputBuilder()
        .setCustomId("target_user")
        .setLabel("Usuario (ID o @mención)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const nameInput = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("Nuevo nombre")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(32);

      modal.addComponents(
        new ActionRowBuilder().addComponents(userInput),
        new ActionRowBuilder().addComponents(nameInput)
      );

      return interaction.showModal(modal);
    }
  }

  // ───────── MODAL HANDLER ─────────
  if (interaction.isModalSubmit() && interaction.customId === "rename_modal") {

    const rawUser = interaction.fields.getTextInputValue("target_user");
    const newName = interaction.fields.getTextInputValue("new_name");

    const id = rawUser.replace(/[<@!>]/g, "");
    const target = await interaction.guild.members.fetch(id).catch(() => null);

    if (!target) {
      return interaction.reply({ content: "❌ usuario no encontrado", ephemeral: true });
    }

    const oldName = target.nickname || target.user.username;

    await target.setNickname(newName);
    await interaction.member.roles.remove(TOKENS_ROLE);

    setTimeout(async () => {
      try { await target.setNickname(oldName); } catch {}
    }, 40 * 60 * 1000);

    return interaction.reply({
      content: `✏️ nombre cambiado a **${newName}**`,
      ephemeral: true
    });
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
});

client.login(process.env.TOKEN);
