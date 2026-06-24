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
const GOLD_TOKEN = "1512329392939073636";
const NAME_LOCK_ROLE = "1426678619006046392";

// ⚙️ PREFIX
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
        "🧷 Encadenamiento\n" +
        "💰 1 Token\n" +
        "⛓️ Encadena a un usuario por 30 minutos\n\n" +

        "🔓 Liberación de cárcel\n" +
        "💰 1 Token\n" +
        "🚪 Libera a un usuario inmediatamente\n\n" +

        "✏️ Renombrar usuario\n" +
        "💰 1 Token Dorado\n" +
        "📝 Cambia el nombre de un usuario por 40 minutos\n" +
        "```"
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: "Selecciona un item abajo" });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("🛒 Abrir tienda")
        .addOptions([
          {
            label: "Encadenamiento",
            value: "chain",
            emoji: "🧷"
          },
          {
            label: "Liberación de cárcel",
            value: "release",
            emoji: "🔓"
          },
          {
            label: "Renombrar usuario",
            value: "rename",
            emoji: "✏️"
          }
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

  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    const modal = new ModalBuilder();

    if (option === "rename") {
      modal
        .setCustomId("action_rename_step1")
        .setTitle("Renombrar usuario");

      const input = new TextInputBuilder()
        .setCustomId("target_user")
        .setLabel("Usuario a renombrar (nombre o ID)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      return interaction.showModal(modal);
    }

    modal
      .setCustomId(`action_${option}`)
      .setTitle(option === "chain" ? "Encadenar usuario" : "Liberar usuario");

    const input = new TextInputBuilder()
      .setCustomId("target_user")
      .setLabel("Usuario (nombre o ID)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {

    const buyer = interaction.member;
    const guild = interaction.guild;

    const action = interaction.customId;

    const targetInput = interaction.fields.getTextInputValue("target_user");

    const target = guild.members.cache.find(m =>
      m.user.username.toLowerCase() === targetInput.toLowerCase() ||
      m.id === targetInput.replace(/[^0-9]/g, "")
    );

    if (!target) {
      return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
    }

    // 💸 VALIDACIONES
    if (action === "action_rename_step1") {
      if (!buyer.roles.cache.has(GOLD_TOKEN)) {
        return interaction.reply({ content: "❌ Necesitas Token Dorado.", ephemeral: true });
      }

      // pedir segundo modal (nuevo nombre)
      const modal2 = new ModalBuilder()
        .setCustomId(`action_rename_step2_${target.id}`)
        .setTitle("Nuevo nombre");

      const input2 = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("Escribe el nuevo nombre")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal2.addComponents(new ActionRowBuilder().addComponents(input2));

      return interaction.showModal(modal2);
    }

    // 🧷 ENCADENAR
    if (action === "action_chain") {

      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({ content: "❌ No tienes TOKENS.", ephemeral: true });
      }

      await buyer.roles.remove(TOKENS_ROLE);
      await target.roles.add(PRISON_ROLE);

      setTimeout(async () => {
        try {
          const refreshed = await guild.members.fetch(target.id);
          if (refreshed.roles.cache.has(PRISON_ROLE)) {
            await refreshed.roles.remove(PRISON_ROLE);
          }
        } catch {}
      }, 30 * 60 * 1000);

      return interaction.reply({
        content: `⛓️ ${target.user.username} encadenado por 30 minutos.`,
        ephemeral: true
      });
    }

    // 🔓 LIBERAR
    if (action === "action_release") {

      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({ content: "❌ No tienes TOKENS.", ephemeral: true });
      }

      await buyer.roles.remove(TOKENS_ROLE);
      await target.roles.remove(PRISON_ROLE);

      return interaction.reply({
        content: `🔓 ${target.user.username} liberado.`,
        ephemeral: true
      });
    }

    // ✏️ RENOMBRE FINAL
    if (action.startsWith("action_rename_step2_")) {

      const targetId = action.split("_")[3];
      const newName = interaction.fields.getTextInputValue("new_name");

      const member = await guild.members.fetch(targetId);

      const oldName = member.nickname || member.user.username;

      await member.setNickname(newName);
      await member.roles.remove(NAME_LOCK_ROLE);

      if (buyer.roles.cache.has(GOLD_TOKEN)) {
        await buyer.roles.remove(GOLD_TOKEN);
      }

      setTimeout(async () => {
        try {
          const refreshed = await guild.members.fetch(targetId);
          await refreshed.setNickname(oldName);
        } catch {}
      }, 40 * 60 * 1000);

      return interaction.reply({
        content: `✏️ ${member.user.username} renombrado a "${newName}" por 40 minutos.`,
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
