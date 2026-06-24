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

const prefix = ">";

// ─────────────────────────────
// 🔎 BUSQUEDA INTELIGENTE
// ─────────────────────────────
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  let matches = 0;

  for (let char of a) {
    if (b.includes(char)) matches++;
  }

  return matches / a.length;
}

async function findMember(guild, input) {
  await guild.members.fetch();

  const clean = input.replace(/[^0-9]/g, "");

  // 1️⃣ por ID
  if (clean) {
    try {
      return await guild.members.fetch(clean);
    } catch {}
  }

  // 2️⃣ exacto
  let exact = guild.members.cache.find(m =>
    m.user.username.toLowerCase() === input.toLowerCase()
  );

  if (exact) return exact;

  // 3️⃣ fuzzy (mal escrito)
  let best = null;
  let bestScore = 0;

  guild.members.cache.forEach(m => {
    if (m.user.bot) return;

    const score = similarity(input, m.user.username);

    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  });

  // mínimo para evitar errores
  if (bestScore > 0.4) return best;

  return null;
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
        "⛓️ 30 minutos de prisión\n\n" +
        "🔓 Liberación - 1 TOKEN\n" +
        "🚪 Libera instantáneamente\n\n" +
        "✏️ Renombrar - 1 TOKEN DORADO\n" +
        "📝 Cambia nombre por 40 minutos\n" +
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

    return message.channel.send({ embeds: [embed], components: [menu] });
  }
});

// ─────────────────────────────
// ⚡ INTERACCIONES
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isStringSelectMenu()) {

    const option = interaction.values[0];

    const modal = new ModalBuilder();

    modal.setCustomId(`action_${option}`);
    modal.setTitle(option === "rename" ? "Renombrar usuario" : "Acción");

    const input = new TextInputBuilder()
      .setCustomId("target_user")
      .setLabel("Usuario (nombre o ID)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {

    const buyer = interaction.member;
    const guild = interaction.guild;

    const action = interaction.customId;
    const input = interaction.fields.getTextInputValue("target_user");

    const target = await findMember(guild, input);

    if (!target) {
      return interaction.reply({
        content: "❌ No encontré ese usuario.",
        ephemeral: true
      });
    }

    // 💸 TOKEN NORMAL
    if (!action.includes("rename")) {
      if (!buyer.roles.cache.has(TOKENS_ROLE)) {
        return interaction.reply({ content: "❌ No tienes TOKENS.", ephemeral: true });
      }
      await buyer.roles.remove(TOKENS_ROLE);
    }

    // 🧷 ENCADENAR
    if (action === "action_chain") {

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

    // 🔓 LIBERAR
    if (action === "action_release") {

      await target.roles.remove(PRISON_ROLE);

      return interaction.reply({
        content: `🔓 ${target.user.username} liberado.`,
        ephemeral: true
      });
    }

    // ✏️ RENOMBRAR (STEP 2)
    if (action === "action_rename") {

      if (!buyer.roles.cache.has(GOLD_TOKEN)) {
        return interaction.reply({
          content: "❌ Necesitas Token Dorado.",
          ephemeral: true
        });
      }

      const newNameModal = new ModalBuilder()
        .setCustomId(`rename_final_${target.id}`)
        .setTitle("Nuevo nombre");

      const input2 = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("Nuevo nombre del usuario")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      newNameModal.addComponents(new ActionRowBuilder().addComponents(input2));

      return interaction.showModal(newNameModal);
    }

    // ✏️ FINAL RENOMBRE
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

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot activo como ${c.user.tag}`);
});

client.login(process.env.TOKEN);
