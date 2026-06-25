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

const mongoose = require("mongoose");

// 🤖 CLIENTE
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

// 🛡️ INMUNIDADES
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// ─────────────────────────────
// 📦 MONGO MODEL
// ─────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

const userSchema = new mongoose.Schema({
  userId: String,
  prison: { type: Boolean, default: false },
  shield: { type: Boolean, default: false },
  immunity: { type: Boolean, default: false },
  renameUntil: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// ─────────────────────────────
// 🤖 BOT
// ─────────────────────────────
const prefix = ">";

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

  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🤖 vuelve cuando tengas un token.");
    }

    const loading = await message.channel.send("🟣 iniciando sistema...");
    await new Promise(r => setTimeout(r, 2000));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription("Sistema cargado")
      .setColor(0x8b5cf6);

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

    await loading.edit({ content: "", embeds: [embed], components: [menu] });
  }
});

// ─────────────────────────────
// 🧠 HELPERS MONGO
// ─────────────────────────────
async function getUser(id) {
  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });
  return user;
}

// ─────────────────────────────
// ⚡ INTERACTIONS
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    if (option === "close") {
      await interaction.update({ content: "cerrando...", embeds: [], components: [] });
      return interaction.deleteReply();
    }

    const menu = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`user_${option}`)
        .setPlaceholder("selecciona usuario")
        .setMaxValues(1)
    );

    return interaction.reply({ content: "elige usuario:", components: [menu], ephemeral: true });
  }

  if (interaction.isUserSelectMenu()) {

    const [_, action] = interaction.customId.split("_");

    const targetId = interaction.values[0];
    const guild = interaction.guild;

    const target = await guild.members.fetch(targetId).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    const data = await getUser(target.id);

    // 🧷 ENCADENAR
    if (action === "chain") {

      if (target.roles.cache.has(PRISON_ROLE)) {
        return interaction.reply({ content: "ya está en prisión", ephemeral: true });
      }

      await target.roles.add(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      data.prison = true;
      await data.save();

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(PRISON_ROLE);

          await User.updateOne({ userId: target.id }, { prison: false });
        } catch {}
      }, 30 * 60 * 1000);

      return interaction.reply({ content: "encadenado", ephemeral: true });
    }

    // ⛓️ LIBERAR
    if (action === "release") {

      await target.roles.remove(PRISON_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      await User.updateOne({ userId: target.id }, { prison: false });

      return interaction.reply({ content: "liberado", ephemeral: true });
    }

    // 🛡️ INMUNIDAD
    if (action === "immunity") {

      await target.roles.add(IMMUNITY_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      data.immunity = true;
      await data.save();

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(IMMUNITY_ROLE);
          await User.updateOne({ userId: target.id }, { immunity: false });
        } catch {}
      }, 60 * 60 * 1000);

      return interaction.reply({ content: "inmunidad activa", ephemeral: true });
    }

    // 🛡️ ESCUDO
    if (action === "shield") {

      await target.roles.add(SHIELD_ROLE);
      await buyer.roles.remove(TOKENS_ROLE);

      data.shield = true;
      await data.save();

      setTimeout(async () => {
        try {
          const m = await guild.members.fetch(target.id);
          await m.roles.remove(SHIELD_ROLE);
          await User.updateOne({ userId: target.id }, { shield: false });
        } catch {}
      }, 60 * 60 * 1000);

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

  if (interaction.isModalSubmit()) {

    if (interaction.customId.startsWith("rename_")) {

      const targetId = interaction.customId.split("_")[1];
      const newName = interaction.fields.getTextInputValue("new_name");

      const member = await interaction.guild.members.fetch(targetId);

      const old = member.nickname || member.user.username;

      await member.setNickname(newName);

      setTimeout(async () => {
        try {
          const m = await interaction.guild.members.fetch(targetId);
          await m.setNickname(old);
        } catch {}
      }, 40 * 60 * 1000);

      await interaction.reply({ content: "renombrado", ephemeral: true });
    }
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
});

client.login(process.env.TOKEN);
