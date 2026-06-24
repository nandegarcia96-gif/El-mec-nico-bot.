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

// IDS
const TOKENS_ROLE = "1517347810167619697";
const PRISON_ROLE = "1459458843816759412";

const prefix = ">";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // COMANDO TIENDA
  if (command === "call" && args[0] === "mechanic") {
    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("❌ No tienes TOKENS para usar la tienda.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛒 The Mechanic Store")
      .setDescription("Selecciona un ítem para comprar con tus TOKENS.")
      .setColor(0x8b5cf6);

    // BOTÓN DEL ITEM
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_chain")
        .setLabel("🧷 Comprar Encadenamiento")
        .setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // 🧷 COMPRA ENCADENAMIENTO
  if (interaction.customId === "buy_chain") {
    const guild = interaction.guild;

    const members = await guild.members.fetch();

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
      content: "👤 Selecciona el usuario a encadenar:",
      components: [menu],
      ephemeral: true
    });
  }

  // 🎯 EJECUCIÓN FINAL
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "select_chain_target") {
      const targetId = interaction.values[0];

      const guild = interaction.guild;

      const buyer = interaction.member;
      const target = await guild.members.fetch(targetId);

      // Dar prisión
      await target.roles.add(PRISON_ROLE);

      // Quitar tokens al comprador
      await buyer.roles.remove(TOKENS_ROLE);

      return interaction.update({
        content: `⛓️ ${target.user.username} ha sido encadenado correctamente.`,
        components: []
      });
    }
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot activo como ${c.user.tag}`);
});

client.login(process.env.TOKEN);
