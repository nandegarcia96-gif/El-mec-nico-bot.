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
// 🤖 MESSAGE SYSTEM
// ─────────────────────────────
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

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
    await new Promise(r => setTimeout(r, 1500));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +

        "🧷 ENCANDENAMIENTO\n🪙 COSTE: 1 TOKEN\n⏳ 30 min\n⚙️ encierra a un usuario\n\n" +

        "⛓️ LIBERACIÓN\n🪙 COSTE: 1 TOKEN\n⚙️ elimina prisión\n\n" +

        "✏️ RENOMBRAR USUARIO\n🪙 COSTE: 1 TOKEN\n⏳ 40 min\n⚙️ nickname temporal\n\n" +

        "🛡️ INMUNIDAD CD\n🪙 COSTE: 1 TOKEN\n⏳ 1 HORA\n⚙️ ignora cooldown\n\n" +

        "🛡️ ESCUDO [1 IMPACTO]\n🪙 COSTE: 1 TOKEN\n⏳ 1 HORA\n⚙️ bloquea ataque\n\n" +

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
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" },
          { label: "Escudo", value: "shield", emoji: "🛡️" },
          { label: "Cerrar tienda", value: "close", emoji: "❌" }
        ])
    );

    await loading.edit({ content: "", embeds: [embed], components: [menu] });
  }

  // ─────────────────────────────
  // 📘 HELP
  // ─────────────────────────────
  if (args[0] === "mechanic" && args[1] === "help") {

    const embed = new EmbedBuilder()
      .setTitle("🤖 ⚙️ MECHANIC SYSTEM GUIDE")
      .setColor(0x8b5cf6)
      .setDescription(
        "```yaml\n" +

        "📌 COMANDOS\n>call mechanic\n>mechanic help\n\n" +

        "🪙 TOKENS\nmoneda del sistema\n\n" +

        "🧷 ENCANDENAMIENTO\n30 min prisión\n\n" +

        "⛓️ LIBERACIÓN\nquita prisión\n\n" +

        "✏️ RENOMBRAR\nnickname temporal\n\n" +

        "🛡️ INMUNIDAD CD\ncooldown bypass\n\n" +

        "🛡️ ESCUDO\nbloquea ataque\n\n" +

        "📡 SISTEMA\nestable\n\n" +

        "⚠️ la tienda puede cambiar\n" +

        "```"
      )
      .setFooter({ text: "🤖 GUIDE SYSTEM" });

    return message.channel.send({ embeds: [embed] });
  }
});

// ─────────────────────────────
// ⚡ INTERACTIONS
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // ───────── SHOP MENU ─────────
  if (interaction.isStringSelectMenu() && interaction.customId === "shop_menu") {

    const option = interaction.values[0];

    if (option === "close") {
      return interaction.update({
        content: "🤖 cerrando sistema...",
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
  if (interaction.isUserSelectMenu() && interaction.customId.startsWith("user_")) {

    const action = interaction.customId.split("_")[1];
    const targetId = interaction.values[0];

    return interaction.update({
      content: `confirmar **${action}** en <@${targetId}>`,
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`execute_${action}_${targetId}`)
            .addOptions([
              { label: "Confirmar", value: "yes", emoji: "✔️" },
              { label: "Cancelar", value: "no", emoji: "❌" }
            ])
        )
      ]
    });
  }

  // ───────── EXECUTE ─────────
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("execute_")) {

    const [, action, targetId] = interaction.customId.split("_");

    if (interaction.values[0] === "no") {
      return interaction.update({ content: "❌ cancelado", components: [] });
    }

    const guild = interaction.guild;
    const buyer = interaction.member;
    const target = await guild.members.fetch(targetId).catch(() => null);

    if (!target) {
      return interaction.update({ content: "usuario no encontrado", components: [] });
    }

    const isImmune = IMMUNE_ROLES.some(r => target.roles.cache.has(r));

    if (action === "chain") {

      if (isImmune) return interaction.update({ content: "inmune", components: [] });

      await target.roles.add(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(PRISON_ROLE); } catch {}
      }, 30 * 60 * 1000);

      return interaction.update({ content: "🧷 encadenado", components: [] });
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);
      return interaction.update({ content: "⛓️ liberado", components: [] });
    }

    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(IMMUNITY_ROLE); } catch {}
      }, 60 * 60 * 1000);

      return interaction.update({ content: "🛡️ inmunidad", components: [] });
    }

    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(SHIELD_ROLE); } catch {}
      }, 60 * 60 * 1000);

      return interaction.update({ content: "🛡️ escudo", components: [] });
    }

    // ───────── RENAMER (MODAL) ─────────
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

    if (!target) {
      return interaction.reply({ content: "usuario no encontrado", ephemeral: true });
    }

    const old = target.nickname || target.user.username;

    await target.setNickname(newName);
    await interaction.member.roles.remove(TOKENS_ROLE);

    setTimeout(async () => {
      try { await target.setNickname(old); } catch {}
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
