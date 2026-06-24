const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
// 🛒 COMANDO TIENDA
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
        "ITEM DISPONIBLE\n" +
        "────────────────────\n" +
        "🧷 Encadenamiento\n" +
        "💰 Precio: 1 TOKEN\n" +
        "🎯 Encadena a un usuario\n" +
        "────────────────────\n" +
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
            description: "Encadena a un usuario (1 token)",
            value: "chain",
            emoji: "🧷"
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

      if (interaction.values[0] === "chain") {

        const modal = new ModalBuilder()
          .setCustomId("chain_modal")
          .setTitle("🧷 Encadenar usuario");

        const input = new TextInputBuilder()
          .setCustomId("target_user")
          .setLabel("Escribe nombre, @usuario o ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Ej: Juan / @user / 123456")
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);

        modal.addComponents(row);

        return interaction.showModal(modal);
      }
    }
  }

  // 🧾 MODAL SUBMIT (COMPRA FINAL)
  if (interaction.isModalSubmit()) {

    if (interaction.customId === "chain_modal") {

      const input = interaction.fields.getTextInputValue("target_user");

      const buyer = interaction.member;

      // ❌ CHECK TOKENS
      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({
          content: "❌ No tienes TOKENS para comprar.",
          ephemeral: true
        });
      }

      const guild = interaction.guild;

      // 🔎 BUSCAR USUARIO
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

      // ⛓️ DAR PRISIÓN
      await target.roles.add(PRISON_ROLE);

      // 💸 QUITAR TOKENS
      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.reply({
        content: `⛓️ ${target.user.username} ha sido encadenado correctamente.`,
        ephemeral: true
      });
    }
  }
});

// 🤖 BOT READY
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot activo como ${c.user.tag}`);
});

client.login(process.env.TOKEN);
