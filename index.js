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

// 🔐 RESTRICCIÓN CANAL
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

const userSchema = new mongoose.Schema({
  userId: String,
  prison: { type: Boolean, default: false },
  shield: { type: Boolean, default: false },
  immunity: { type: Boolean, default: false },
  renameUntil: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// ─────────────────────────────
// 🤖 BOT
// ─────────────────────────────
const prefix = ">";

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  // 📌 SOLO CANAL PERMITIDO
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  if (message.mentions.has(client.user)) {
    return message.reply(
      "🤖 Parece que no tengo ningún motivo para ayudarte.\n" +
      "vuelve cuando tengas un token o algo de mi interés."
    );
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // 🛒 TIENDA
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
        "⚙️ EFECTO: Cambia temporalmente el nickname\n\n" +

        "🛡️ INMUNIDAD CD\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⏳ DURACIÓN: 1 HORA\n" +
        "⚙️ EFECTO: Ignora slowmode / cooldown del sistema\n\n" +

        "🛡️ ESCUDO [1 IMPACTO]\n" +
        "🪙 COSTE: 1 TOKEN\n" +
        "⏳ DURACIÓN: 1 HORA\n" +
        "⚙️ EFECTO: Bloquea el primer intento de ataque\n\n" +

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

  // 📘 HELP
  if (args[0] === "mechanic" && args[1] === "help") {

    const embed = new EmbedBuilder()
      .setTitle("🤖 ⚙️ MECHANIC SYSTEM GUIDE")
      .setColor(0x8b5cf6)
      .setDescription(
        "```yaml\n" +

        "📌 COMANDOS\n" +
        ">call mechanic → abre la tienda\n" +
        ">mechanic help → esta guía\n\n" +

        "🪙 TOKENS\n" +
        "Moneda del sistema usada para comprar ítems.\n\n" +

        "🧷 ENCANDENAMIENTO\n" +
        "Prisión temporal de 30 minutos.\n\n" +

        "⛓️ LIBERACIÓN\n" +
        "Elimina prisión inmediatamente.\n\n" +

        "✏️ RENOMBRAR\n" +
        "Nickname temporal por 40 minutos.\n\n" +

        "🛡️ INMUNIDAD CD\n" +
        "Ignora cooldown del sistema por 1 hora.\n\n" +

        "🛡️ ESCUDO [1 IMPACTO]\n" +
        "Bloquea un ataque y se destruye.\n\n" +

        "📡 AVISO\n" +
        "La tienda está sujeta a cambios próximamente.\n" +
        "Se añadirán nuevos ítems y mejoras.\n\n" +

        "📡 SISTEMA\n" +
        "• El sistema se encuentra estable y en funcionamiento\n" +

        "```"
      )
      .setFooter({ text: "🤖 MECHANIC GUIDE SYSTEM" });

    return message.channel.send({ embeds: [embed] });
  }
});

// ─────────────────────────────
// ⚡ INTERACCIONES
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // 🧠 SELECT MENU PRINCIPAL
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

    // 👉 CONFIRMACIÓN
    const menu = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`confirm_${option}`)
        .setPlaceholder("selecciona usuario")
        .setMaxValues(1)
    );

    return interaction.reply({
      content: "⚠️ confirma usuario para continuar",
      components: [menu],
      ephemeral: true
    });
  }

  // 👤 CONFIRM STEP
  if (interaction.isUserSelectMenu() && interaction.customId.startsWith("confirm_")) {

    const action = interaction.customId.split("_")[1];
    const targetId = interaction.values[0];

    return interaction.update({
      content: `⚠️ confirmar acción **${action}** en <@${targetId}>`,
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`execute_${action}_${targetId}`)
            .setPlaceholder("confirmar ejecución")
            .addOptions([
              { label: "Confirmar", value: "yes", emoji: "✔️" },
              { label: "Cancelar", value: "no", emoji: "❌" }
            ])
        )
      ]
    });
  }

  // ⚡ EJECUCIÓN FINAL
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("execute_")) {

    const [, action, targetId] = interaction.customId.split("_");

    if (interaction.values[0] === "no") {
      return interaction.update({
        content: "❌ acción cancelada",
        components: []
      });
    }

    const guild = interaction.guild;
    const buyer = interaction.member;
    const target = await guild.members.fetch(targetId).catch(() => null);

    if (!target) {
      return interaction.update({ content: "usuario no encontrado", components: [] });
    }

    // 🧷 ENC
    if (action === "chain") {
      await target.roles.add(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(PRISON_ROLE); } catch {}
      }, 30 * 60 * 1000);

      return interaction.update({ content: "🧷 encadenado", components: [] });
    }

    // ⛓️ LIBERACIÓN
    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.update({ content: "⛓️ liberado", components: [] });
    }

    // 🛡️ INMUNIDAD
    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(IMMUNITY_ROLE); } catch {}
      }, 60 * 60 * 1000);

      return interaction.update({ content: "🛡️ inmunidad activada", components: [] });
    }

    // 🛡️ ESCUDO
    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.roles.remove(SHIELD_ROLE); } catch {}
      }, 60 * 60 * 1000);

      return interaction.update({ content: "🛡️ escudo activado", components: [] });
    }

    // ✏️ RENOMBRAR
    if (action === "rename") {

      const old = target.nickname || target.user.username;

      await target.setNickname("MECHANIC USER");
      await buyer.roles.remove(TOKENS_ROLE);

      setTimeout(async () => {
        try { await target.setNickname(old); } catch {}
      }, 40 * 60 * 1000);

      return interaction.update({ content: "✏️ renombrado aplicado", components: [] });
    }
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
});

client.login(process.env.TOKEN);
