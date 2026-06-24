const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🔐 IDS DE ROLES
const TOKENS_ROLE = "1517347810167619697";
const PRISON_ROLE = "1459458843816759412";

// ⚙️ PREFIX
const prefix = ">";

// ─────────────────────────────
// 🧠 COMANDOS DE TEXTO
// ─────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 🛒 TIENDA
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
        "🎯 Efecto: Encadena a un usuario\n" +
        "────────────────────\n" +
        "```"
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: "Selecciona un item abajo para comprar" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_chain")
        .setLabel("🧷 Comprar Encadenamiento")
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Primary)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

// ─────────────────────────────
// ⚡ INTERACCIONES (BOTONES / MENÚS)
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // 🔘 BOTÓN: COMPRAR ENCADENAMIENTO
  if (interaction.isButton()) {
    if (interaction.customId === "buy_chain") {

      const members = await interaction.guild.members.fetch();

      const options = members
        .filter(m => !m.user.bot && m.id !== interaction.user.id)
        .map(m => ({
          label: m.user.username.slice(0, 25),
          value: m.id
        }))
        .slice(0, 25);

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select_chain_target")
          .setPlaceholder("Selecciona el usuario a encadenar")
          .addOptions(options)
      );

      return interaction.reply({
        content: "👤 Selecciona el usuario que quieres encadenar:",
        components: [menu],
        ephemeral: true
      });
    }
  }

  // 🎯 SELECT MENU: EJECUCIÓN FINAL
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "select_chain_target") {

      const targetId = interaction.values[0];

      const guild = interaction.guild;

      const buyer = interaction.member;
      const target = await guild.members.fetch(targetId);

      // ❌ CHECK TOKENS
      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({
          content: "❌ No tienes TOKENS para completar la compra.",
          ephemeral: true
        });
      }

      // ⛓️ DAR PRISIÓN
      await target.roles.add(PRISON_ROLE);

      // 💸 QUITAR TOKENS
      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.update({
        content: `⛓️ ${target.user.username} ha sido encadenado correctamente.`,
        components: []
      });
    }
  }
});

// ─────────────────────────────
// 🤖 BOT LISTO
// ─────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot activo como ${c.user.tag}`);
});

client.login(process.env.TOKEN);
