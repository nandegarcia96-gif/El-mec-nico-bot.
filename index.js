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

const LOG_CHANNEL = "1519438831479427192";

const prefix = ">";

// ─────────────────────────────
// 📜 LOGS
// ─────────────────────────────
async function log(guild, msg) {
  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL);
    if (ch) ch.send({ content: msg });
  } catch {}
}

// ─────────────────────────────
// 🛒 TIENDA
// ─────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("❌ No tienes acceso.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛒 The Mechanic Store")
      .setDescription(
        "🧷 Encadenamiento (1 token)\n" +
        "🔓 Liberación (1 token)\n" +
        "✏️ Renombrar (1 token)\n" +
        "🛡️ Inmunidad CD (1 token)"
      )
      .setColor(0x8b5cf6);

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("Selecciona item")
        .addOptions([
          { label: "Encadenar", value: "chain" },
          { label: "Liberar", value: "release" },
          { label: "Renombrar", value: "rename" },
          { label: "Inmunidad", value: "immunity" }
        ])
    );

    return message.channel.send({ embeds: [embed], components: [menu] });
  }
});

// ─────────────────────────────
// ⚡ INTERACCIONES
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // ───── MENU ─────
  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    if (option === "rename") {

      const menu = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`user_${option}`)
          .setPlaceholder("Selecciona usuario")
          .setMaxValues(1)
      );

      return interaction.reply({
        content: "👤 Elige usuario:",
        components: [menu],
        ephemeral: true
      });
    }

    // otros items también usan user select
    const menu = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`user_${option}`)
        .setPlaceholder("Selecciona usuario")
        .setMaxValues(1)
    );

    return interaction.reply({
      content: "👤 Elige usuario:",
      components: [menu],
      ephemeral: true
    });
  }

  // ───── USER SELECT ─────
  if (interaction.isUserSelectMenu()) {

    const [_, action] = interaction.customId.split("_");
    const targetId = interaction.values[0];

    const guild = interaction.guild;
    const buyer = interaction.member;

    const target = await guild.members.fetch(targetId).catch(() => null);

    if (!target) {
      return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
    }

    // 🧷 ENC
    if (action === "chain") {

      await target.roles.add(PRISON_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(PRISON_ROLE);
        } catch {}
      }, 30 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      await log(guild, `⛓️ ${buyer.user.tag} encadenó a ${target.user.tag}`);

      return interaction.reply({ content: "⛓️ Encadenado.", ephemeral: true });
    }

    // 🔓 LIB
    if (action === "release") {

      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      await log(guild, `🔓 ${buyer.user.tag} liberó a ${target.user.tag}`);

      return interaction.reply({ content: "🔓 Liberado.", ephemeral: true });
    }

    // 🛡️ INMUNIDAD
    if (action === "immunity") {

      await target.roles.add(IMMUNITY_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(IMMUNITY_ROLE);
        } catch {}
      }, 60 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      await log(guild, `🛡️ ${buyer.user.tag} dio inmunidad a ${target.user.tag}`);

      return interaction.reply({ content: "🛡️ Inmunidad activada.", ephemeral: true });
    }

    // ✏️ RENOMBRAR (requiere modal extra)
    if (action === "rename") {

      const modal = new ModalBuilder()
        .setCustomId(`rename_${targetId}`)
        .setTitle("Nuevo nombre");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("Nuevo nombre")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }
  }

  // ───── MODAL ─────
  if (interaction.isModalSubmit()) {

    const guild = interaction.guild;
    const buyer = interaction.member;

    if (interaction.customId.startsWith("rename_")) {

      const targetId = interaction.customId.split("_")[1];
      const newName = interaction.fields.getTextInputValue("new_name");

      const member = await guild.members.fetch(targetId);

      const oldName = member.nickname || member.user.username;

      await member.setNickname(newName);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(targetId);
          await m.setNickname(oldName);
        } catch {}
      }, 40 * 60 * 1000);

      await buyer.roles.remove(TOKENS_ROLE);

      await log(guild, `✏️ ${buyer.user.tag} renombró a ${member.user.tag}`);

      return interaction.reply({
        content: "✏️ Renombrado correctamente.",
        ephemeral: true
      });
    }
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot activo como ${c.user.tag}`);
});

client.login(process.env.TOKEN);
