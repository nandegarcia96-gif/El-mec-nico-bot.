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
const SHIELD_ROLE = "ID_DEL_ROL_ESCUDO"; // ⚠️ pon tu ID real

// 📜 LOG CHANNEL
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
// 🛡️ ESCUDO (1 IMPACTO)
// ─────────────────────────────
async function breakShieldIfExists(target, guild) {
  if (!target.roles.cache.has(SHIELD_ROLE)) return false;

  await target.roles.remove(SHIELD_ROLE).catch(() => {});

  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL);
    if (ch) ch.send(`🛡️ El escudo de ${target.user.tag} se ha roto.`);
  } catch {}

  return true;
}

// ─────────────────────────────
// 🛒 TIENDA (LOADING CYBER)
// ─────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("❌ No tienes acceso.");
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");

    await new Promise(r => setTimeout(r, 1200));
    await loading.edit("🟣 🧠 conectando núcleo...");

    await new Promise(r => setTimeout(r, 1200));
    await loading.edit("🟣 🔓 descifrando tienda...");

    await new Promise(r => setTimeout(r, 900));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +

        "🧷 ENCANDENAMIENTO\n🪙 1 TOKEN\n⛓️ 30 min\n\n" +

        "⛓️ LIBERACIÓN\n🪙 1 TOKEN\n⛓️💥 remove prisión\n\n" +

        "✏️ RENOMBRAR\n🪙 1 TOKEN\n📝 40 min\n\n" +

        "🛡️ INMUNIDAD CD\n🪙 1 TOKEN\n⏳ 1 hora\n\n" +

        "🛡️ ESCUDO [1 IMPACTO]\n🪙 1 TOKEN\n" +
        "🧠 Bloquea 1 intento de cualquier ítem\n" +
        "💥 Se rompe al primer ataque\n" +
        "⏳ Dura hasta 1 hora\n" +

        "```"
      )
      .setColor(0x8b5cf6)
      .setImage("https://cdn.discordapp.com/attachments/1402268718360297544/1519443095379513496/E42BDE84-B055-4A1C-B788-620B7DC904AD.gif")
      .setFooter({ text: "⚙️ sistema activo" });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("⚡ seleccionar módulo")
        .addOptions([
          { label: "Encadenar", value: "chain", emoji: "🧷" },
          { label: "Liberación", value: "release", emoji: "⛓️‍💥" },
          { label: "Renombrar", value: "rename", emoji: "✏️" },
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" },
          { label: "Escudo [1 impacto]", value: "shield", emoji: "🛡️" }
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
// ⚡ INTERACCIONES
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // MENU
  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    const menu = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`user_${option}`)
        .setPlaceholder("👤 selecciona usuario")
        .setMaxValues(1)
    );

    return interaction.reply({
      content: "👤 elige usuario:",
      components: [menu],
      ephemeral: true
    });
  }

  // USER SELECT
  if (interaction.isUserSelectMenu()) {

    const [_, action] = interaction.customId.split("_");
    const targetId = interaction.values[0];

    const guild = interaction.guild;
    const buyer = interaction.member;

    const target = await guild.members.fetch(targetId).catch(() => null);

    if (!target) {
      return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
    }

    // 🛡️ ESCUDO CHECK
    if (await breakShieldIfExists(target, guild)) {
      return interaction.reply({
        content: "🛡️ El escudo bloqueó el efecto y se rompió.",
        ephemeral: true
      });
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

    // ⛓️‍💥 LIBERACIÓN
    if (action === "release") {

      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      await log(guild, `⛓️‍💥 ${buyer.user.tag} liberó a ${target.user.tag}`);

      return interaction.reply({ content: "⛓️‍💥 Liberado.", ephemeral: true });
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

      await log(guild, `🛡️ ${buyer.user.tag} dio inmunidad a ${target.user.tag}`);

      return interaction.reply({ content: "🛡️ Inmunidad activada.", ephemeral: true });
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

      await log(guild, `🛡️ ${buyer.user.tag} dio ESCUDO a ${target.user.tag}`);

      return interaction.reply({
        content: "🛡️ Escudo [1 impacto] activado.",
        ephemeral: true
      });
    }

    // ✏️ RENOMBRAR
    if (action === "rename") {

      const modal = new ModalBuilder()
        .setCustomId(`rename_${targetId}`)
        .setTitle("Nuevo nombre");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("Escribe el nuevo nombre")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }
  }

  // MODAL
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

client.once(Events.ClientReady, () => {
  console.log("⚙️ Mechanic online");
});

client.login(process.env.TOKEN);
