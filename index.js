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
      return message.reply("❌ No tienes TOKENS para usar la tienda.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛒 The Mechanic Store")
      .setDescription(
        "```yaml\n" +
        "ITEMS DISPONIBLES\n" +
        "────────────────────\n" +
        "🧷 Encadenamiento\n" +
        "🔓 Liberación de cárcel\n" +
        "💰 Precio: 1 TOKEN cada uno\n" +
        "────────────────────\n" +
        "```"
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: "Selecciona un item en el menú inferior" });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("🛒 Abrir tienda")
        .addOptions([
          {
            label: "Encadenamiento",
            description: "Encadena a un usuario (1 token)",
            value: "chain",
            emoji: "🧷"
          },
          {
            label: "Liberación de cárcel",
            description: "Libera a un usuario (1 token)",
            value: "release",
            emoji: "🔓"
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

  // 📋 MENU TIENDA
  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === "shop_menu") {

      const option = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`action_${option}`)
        .setTitle(option === "chain" ? "Encadenar usuario" : "Liberar usuario");

      const input = new TextInputBuilder()
        .setCustomId("target_user")
        .setLabel("Escribe nombre, @usuario o ID")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);

      modal.addComponents(row);

      return interaction.showModal(modal);
    }
  }

  // 🧾 MODAL SUBMIT
  if (interaction.isModalSubmit()) {

    const input = interaction.fields.getTextInputValue("target_user");
    const buyer = interaction.member;

    if (!buyer.roles.cache.has(TOKENS_ROLE)) {
      return interaction.reply({
        content: "❌ No tienes TOKENS.",
        ephemeral: true
      });
    }

    const guild = interaction.guild;

    const target = guild.members.cache.find(m =>
      m.user.username.toLowerCase() === input.toLowerCase() ||
      m.id === input.replace(/[^0-9]/g, "")
    );

    if (!target) {
      return interaction.reply({
        content: "❌ Usuario no encontrado.",
        ephemeral: true
      });
    }

    const action = interaction.customId.replace("action_", "");

    // 💸 gastar token
    await buyer.roles.remove(TOKENS_ROLE);

    // ────────────────
    // 🧷 ENCADENAR
    // ────────────────
    if (action === "chain") {

      await target.roles.add(PRISON_ROLE);

      // ⏳ auto remover en 30 min
      setTimeout(async () => {
        try {
          const refreshed = await interaction.guild.members.fetch(target.id);
          if (refreshed.roles.cache.has(PRISON_ROLE)) {
            await refreshed.roles.remove(PRISON_ROLE);
          }
        } catch (err) {
          console.log("Error quitando prisión:", err);
        }
      }, 30 * 60 * 1000);

      return interaction.reply({
        content: `⛓️ ${target.user.username} ha sido encadenado por 30 minutos.`,
        ephemeral: true
      });
    }

    // ────────────────
    // 🔓 LIBERAR
    // ────────────────
    if (action === "release") {

      await target.roles.remove(PRISON_ROLE);

      return interaction.reply({
        content: `🔓 ${target.user.username} ha sido liberado de la cárcel.`,
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
