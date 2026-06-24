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

// 📜 LOG CHANNEL
const LOG_CHANNEL = "1519438831479427192";

const prefix = ">";

// ─────────────────────────────
// 📜 LOG FUNCTION
// ─────────────────────────────
async function sendLog(guild, text) {
  try {
    const channel = await guild.channels.fetch(LOG_CHANNEL);
    if (channel) channel.send({ content: text });
  } catch (err) {
    console.log("Error logs:", err);
  }
}

// ─────────────────────────────
// 🛒 TIENDA
// ─────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "call" && args[0] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("❌ No tienes acceso a la tienda.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛒 The Mechanic Store")
      .setDescription(
        "```yaml\n" +
        "🧷 Encadenamiento - 1 TOKEN\n" +
        "⛓️ 30 min prisión\n\n" +

        "🔓 Liberación - 1 TOKEN\n" +
        "🚪 quita prisión\n\n" +

        "✏️ Renombrar - 1 TOKEN\n" +
        "📝 40 min cambio de nombre\n\n" +

        "🛡️ Inmunidad CD - 1 TOKEN\n" +
        "⏳ 1 hora protección\n" +
        "```"
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: "Selecciona un item" });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("🛒 Abrir tienda")
        .addOptions([
          { label: "Encadenamiento", value: "chain", emoji: "🧷" },
          { label: "Liberación", value: "release", emoji: "🔓" },
          { label: "Renombrar", value: "rename", emoji: "✏️" },
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" }
        ])
    );

    return message.channel.send({
      embeds: [embed],
      components: [menu]
    });
  }
});

// ─────────────────────────────
// ⚡ INTERACCIONES
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // MENU
  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    // RENOMBRAR (USER SELECT)
    if (option === "rename") {

      const menu = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId("rename_select_user")
          .setPlaceholder("👤 Selecciona usuario")
          .setMaxValues(1)
      );

      return interaction.reply({
        content: "👤 Selecciona usuario a renombrar:",
        components: [menu],
        ephemeral: true
      });
    }

    // OTROS ITEMS (MODAL)
    const modal = new ModalBuilder()
      .setCustomId(`action_${option}`)
      .setTitle("The Mechanic");

    const input = new TextInputBuilder()
      .setCustomId("target_user")
      .setLabel("Menciona al usuario (@usuario)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  // USER SELECT (RENOMBRE)
  if (interaction.isUserSelectMenu()) {

    if (interaction.customId === "rename_select_user") {

      const targetId = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`rename_final_${targetId}`)
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

  // MODALS
  if (interaction.isModalSubmit()) {

    const guild = interaction.guild;
    const buyer = interaction.member;
    const action = interaction.customId;

    // 💸 CHECK TOKEN (except rename final)
    if (!action.startsWith("rename_final_")) {
      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({ content: "❌ No tienes TOKENS.", ephemeral: true });
      }
      await buyer.roles.remove(TOKENS_ROLE);
    }

    const input = interaction.fields.getTextInputValue("target_user");
    const mention = input?.match?.(/^<@!?(\d+)>$/);

    let target = null;

    if (mention) {
      target = await guild.members.fetch(mention[1]).catch(() => null);
    }

    // 🧷 ENC
    if (action === "action_chain") {

      if (!target) return interaction.reply({ content: "❌ Mención inválida.", ephemeral: true });

      await target.roles.add(PRISON_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(PRISON_ROLE);
        } catch {}
      }, 30 * 60 * 1000);

      await sendLog(guild, `⛓️ ${target.user.tag} fue encadenado por ${buyer.user.tag}`);

      return interaction.reply({ content: "⛓️ Encadenado.", ephemeral: true });
    }

    // 🔓 LIB
    if (action === "action_release") {

      if (!target) return interaction.reply({ content: "❌ Mención inválida.", ephemeral: true });

      await target.roles.remove(PRISON_ROLE);

      await sendLog(guild, `🔓 ${target.user.tag} fue liberado por ${buyer.user.tag}`);

      return interaction.reply({ content: "🔓 Liberado.", ephemeral: true });
    }

    // 🛡️ INMUNIDAD
    if (action === "action_immunity") {

      if (!target) return interaction.reply({ content: "❌ Mención inválida.", ephemeral: true });

      await target.roles.add(IMMUNITY_ROLE);

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(IMMUNITY_ROLE);
        } catch {}
      }, 60 * 60 * 1000);

      await sendLog(guild, `🛡️ ${target.user.tag} recibió inmunidad CD por ${buyer.user.tag}`);

      return interaction.reply({ content: "🛡️ Inmunidad activada.", ephemeral: true });
    }

    // ✏️ RENOMBRE FINAL
    if (action.startsWith("rename_final_")) {

      const targetId = action.split("_")[2];
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

      await sendLog(
        guild,
        `✏️ ${member.user.tag} fue renombrado a "${newName}" por ${buyer.user.tag}`
      );

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
