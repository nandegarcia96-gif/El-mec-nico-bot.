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

const prefix = ">";

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
        "🚪 quitar prisión\n\n" +
        "✏️ Renombrar - 1 TOKEN\n" +
        "📝 cambio de nombre 40 min\n" +
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
          { label: "Renombrar", value: "rename", emoji: "✏️" }
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

  // ───────────────
  // MENU TIENDA
  // ───────────────
  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    // 🧷 ENC + 🔓 LIB
    if (option === "chain" || option === "release") {

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

    // ✏️ RENOMBRAR → USER SELECT
    if (option === "rename") {

      const userMenu = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId("rename_select_user")
          .setPlaceholder("👤 Busca o selecciona un usuario")
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({
        content: "👤 Selecciona el usuario a renombrar:",
        components: [userMenu],
        ephemeral: true
      });
    }
  }

  // ───────────────
  // USER SELECT
  // ───────────────
  if (interaction.isUserSelectMenu()) {

    if (interaction.customId === "rename_select_user") {

      const targetId = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`rename_final_${targetId}`)
        .setTitle("✏️ Nuevo nombre");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("Escribe el nuevo nombre")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }
  }

  // ───────────────
  // MODALS
  // ───────────────
  if (interaction.isModalSubmit()) {

    const guild = interaction.guild;
    const buyer = interaction.member;
    const action = interaction.customId;

    // 💸 check token normal (except rename final)
    if (!action.startsWith("rename_final_")) {
      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({
          content: "❌ No tienes TOKENS.",
          ephemeral: true
        });
      }
      await buyer.roles.remove(TOKENS_ROLE);
    }

    // 🧷 ENC
    if (action === "action_chain") {

      const input = interaction.fields.getTextInputValue("target_user");

      const mention = input.match(/^<@!?(\d+)>$/);
      if (!mention) {
        return interaction.reply({
          content: "❌ Debes mencionar al usuario.",
          ephemeral: true
        });
      }

      const target = await guild.members.fetch(mention[1]).catch(() => null);

      if (!target) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          ephemeral: true
        });
      }

      await target.roles.add(PRISON_ROLE);

      setTimeout(async () => {
        try {
          const refreshed = await guild.members.fetch(target.id);
          await refreshed.roles.remove(PRISON_ROLE);
        } catch {}
      }, 30 * 60 * 1000);

      return interaction.reply({
        content: `⛓️ ${target.user.username} encadenado por 30 minutos.`,
        ephemeral: true
      });
    }

    // 🔓 LIB
    if (action === "action_release") {

      const input = interaction.fields.getTextInputValue("target_user");

      const mention = input.match(/^<@!?(\d+)>$/);
      if (!mention) {
        return interaction.reply({
          content: "❌ Debes mencionar al usuario.",
          ephemeral: true
        });
      }

      const target = await guild.members.fetch(mention[1]).catch(() => null);

      if (!target) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          ephemeral: true
        });
      }

      await target.roles.remove(PRISON_ROLE);

      return interaction.reply({
        content: `🔓 ${target.user.username} liberado.`,
        ephemeral: true
      });
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
          const refreshed = await guild.members.fetch(targetId);
          await refreshed.setNickname(oldName);
        } catch {}
      }, 40 * 60 * 1000);

      return interaction.reply({
        content: `✏️ ${member.user.username} renombrado por 40 minutos.`,
        ephemeral: true
      });
    }
  }
});

// 🤖 READY
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot activo como ${c.user.tag}`);
});

client.login(process.env.TOKEN);
