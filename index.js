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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🔐 ROLES
const TOKENS_ROLE = "1517347810167619697";
const PRISON_ROLE = "1459458843816759412";
const IMMUNITY_ROLE = "1515011976621854790";
const SHIELD_ROLE = "ID_DEL_ROL_ESCUDO";

// 🛡️ INMUNIDAD A PRISIÓN (ROLES PROTEGIDOS)
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 📜 LOGS
const LOG_CHANNEL = "1519438831479427192";

const prefix = ">";

// ─────────────────────────────
// 🤖 MENSAJES BOT
// ─────────────────────────────
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

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
      return message.reply(
        "🤖 Parece que no tengo ningún motivo para ayudarte.\n" +
        "vuelve cuando tengas un token o algo de mi interés."
      );
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");

    await new Promise(r => setTimeout(r, 1200));
    await loading.edit("🟣 🤖 conectando núcleo...");

    await new Promise(r => setTimeout(r, 1200));
    await loading.edit("🟣 🔓 cargando tienda...");

    await new Promise(r => setTimeout(r, 900));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +

        "🧷 ENCANDENAMIENTO\n🪙 1 TOKEN\n⛓️ 30 min\n\n" +

        "⛓️ LIBERACIÓN\n🪙 1 TOKEN\n⛓️💥 elimina prisión\n\n" +

        "✏️ RENOMBRAR USUARIO\n🪙 1 TOKEN\n🤖 cambio temporal 40 min\n\n" +

        "🛡️ INMUNIDAD CD\n🪙 1 TOKEN\n🤖 ignora slowmode del sistema\n⏳ 1 hora\n\n" +

        "🛡️ ESCUDO [1 IMPACTO]\n🪙 1 TOKEN\n💥 bloquea 1 intento de ítem\n⏳ 1 hora\n" +

        "```"
      )
      .setColor(0x8b5cf6)
      .setImage("https://cdn.discordapp.com/attachments/1402268718360297544/1519443095379513496/E42BDE84-B055-4A1C-B788-620B7DC904AD.gif")
      .setFooter({ text: "🤖 system online" });

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

    await loading.edit({
      content: "",
      embeds: [embed],
      components: [menu]
    });
  }
});

// ─────────────────────────────
// 🧠 INMUNIDAD A PRISIÓN
// ─────────────────────────────
function isImmune(member) {
  return IMMUNE_ROLES.some(r => member.roles.cache.has(r));
}

// ─────────────────────────────
// ⚡ INTERACCIONES
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // ❌ CERRAR TIENDA
  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    if (option === "close") {

      await interaction.update({
        content: "🤖 cerrando sistema...",
        embeds: [],
        components: []
      });

      await new Promise(r => setTimeout(r, 1200));

      await interaction.editReply({
        content: "🤖 apagando interfaz..."
      });

      await new Promise(r => setTimeout(r, 1200));

      return interaction.deleteReply();
    }

    const menu = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`user_${option}`)
        .setPlaceholder("selecciona usuario")
        .setMaxValues(1)
    );

    return interaction.reply({
      content: "elige usuario:",
      components: [menu],
      ephemeral: true
    });
  }

  // 👤 USER SELECT
  if (interaction.isUserSelectMenu()) {

    const [_, action] = interaction.customId.split("_");

    const targetId = interaction.values[0];
    const guild = interaction.guild;
    const buyer = interaction.member;

    const target = await guild.members.fetch(targetId).catch(() => null);
    if (!target) return interaction.reply({ content: "usuario no encontrado", ephemeral: true });

    // 🛡️ ESCUDO 1 IMPACTO
    if (target.roles.cache.has(SHIELD_ROLE)) {

      await target.roles.remove(SHIELD_ROLE).catch(() => {});

      return interaction.reply({
        content: "🛡️ escudo activado, efecto cancelado",
        ephemeral: true
      });
    }

    // 🧷 ENC
    if (action === "chain") {

      if (isImmune(target)) {
        return interaction.reply({
          content: "🤖 el objetivo es inmune al encarcelamiento",
          ephemeral: true
        });
      }

      await target.roles.add(PRISON_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(PRISON_ROLE);
        } catch {}
      }, 30 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.reply({ content: "encadenado", ephemeral: true });
    }

    // ⛓️ LIBERACIÓN
    if (action === "release") {

      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.reply({ content: "liberado", ephemeral: true });
    }

    // 🛡️ INMUNIDAD CD
    if (action === "immunity") {

      await target.roles.add(IMMUNITY_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(IMMUNITY_ROLE);
        } catch {}
      }, 60 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.reply({ content: "inmunidad activa", ephemeral: true });
    }

    // 🛡️ ESCUDO
    if (action === "shield") {

      await target.roles.add(SHIELD_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(SHIELD_ROLE);
        } catch {}
      }, 60 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.reply({ content: "escudo activado", ephemeral: true });
    }

    // ✏️ RENOMBRAR
    if (action === "rename") {

      const modal = new ModalBuilder()
        .setCustomId(`rename_${targetId}`)
        .setTitle("nuevo nombre");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("nombre")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }
  }

  // 📝 MODAL RENOMBRAR
  if (interaction.isModalSubmit()) {

    if (interaction.customId.startsWith("rename_")) {

      const guild = interaction.guild;
      const buyer = interaction.member;

      const targetId = interaction.customId.split("_")[1];
      const newName = interaction.fields.getTextInputValue("new_name");

      const member = await guild.members.fetch(targetId);

      const old = member.nickname || member.user.username;

      await member.setNickname(newName);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(targetId);
          await m.setNickname(old);
        } catch {}
      }, 40 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.reply({
        content: "renombrado aplicado",
        ephemeral: true
      });
    }
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
});

client.login(process.env.TOKEN);
