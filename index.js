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

// 🔐 CANAL PERMITIDO
const ALLOWED_CHANNEL = "1519418226973347992";

// 🔐 ROLES
const TOKENS_ROLE = "1517347810167619697";
const PRISON_ROLE = "1459458843816759412";
const IMMUNITY_ROLE = "1515011976621854790";
const SHIELD_ROLE = "1449488332273877153";
const BOOSTER_ROLE = "1427099549364781127";
const EXTRA_ROLE = "1426678812443148430";

// 🛡️ INMUNIDADES
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 📦 MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

const prefix = ">";

// ⏱️ COOLDOWN
const cooldown = new Map();

// 🎲 RANDOM NAMES
const randomNames = [
  "Sombra", "Fénix", "Rayo", "Titán", "Nómada",
  "Cazador", "Fantasma", "Vortex", "Draco", "Orion",
  "Lobo", "Ángel", "Demonio", "Neón", "Eco"
];

// 💾 nombres originales
const originalNames = new Map();

// 🧠 SAFE ROLE REMOVE
async function safeRemoveRole(member, roleId) {
  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
    }
  } catch {
    setTimeout(() => {
      member.roles.remove(roleId).catch(() => {});
    }, 10000);
  }
}

// 🔥 TOKEN CONSUMER
async function consumeToken(member) {
  if (!member.roles.cache.has(TOKENS_ROLE)) return false;
  try {
    await member.roles.remove(TOKENS_ROLE);
    return true;
  } catch {
    return false;
  }
}

// 🟣 MESSAGE SYSTEM
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL) return;

  const now = Date.now();
  const cd = cooldown.get(message.author.id) || 0;

  if (now - cd < 5000) return;
  cooldown.set(message.author.id, now);

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // 🛒 TIENDA COMPLETA RESTAURADA
  if (args[0] === "call" && args[1] === "mechanic") {

    if (!message.member.roles.cache.has(TOKENS_ROLE)) {
      return message.reply("🤖 vuelve cuando tengas un token.");
    }

    const loading = await message.channel.send("🟣 ⚙️ iniciando sistema...");
    await new Promise(r => setTimeout(r, 1200));

    const embed = new EmbedBuilder()
      .setTitle("🛒 ⚙️ THE MECHANIC STORE")
      .setDescription(
        "```yaml\n" +

        "🔗 ENCANDENAMIENTO\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 30 min\n" +
        "⚙️ bloquea acceso a interacciones básicas del sistema\n" +
        "🔗 efecto temporal de restricción de canales\n\n" +

        "⛓️ LIBERACIÓN\n" +
        "🪙 1 TOKEN\n" +
        "⚙️ elimina el efecto de encadenamiento\n" +
        "⛓️‍💥 restaura el acceso normal del usuario\n\n" +

        "✏️ RENOMBRAR USUARIO\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 40 min\n" +
        "⚙️ cambia el nickname del usuario temporalmente\n" +
        "✨ vuelve al nombre original al finalizar\n\n" +

        "🛠️ PERMISOS EXTRAS\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 HORA\n" +
        "⚙️ permisos temporales avanzados\n" +
        "💬 links, archivos, nombre y VC\n\n" +

        "🎲 NOMBRES ALEATORIOS\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 min\n" +
        "⚙️ cambia el nombre del usuario constantemente\n" +
        "💿 cada 10–15 segundos cambia a un nombre\n\n" +

        "🛡️ INMUNIDAD CD\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 HORA\n" +
        "⚙️ ignora el cooldown del servidor\n" +
        "💬 permite uso continuo de acciones\n\n" +

        "🛡️ ESCUDO\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 HORA\n" +
        "⚙️ bloquea 1 acción recibida del sistema\n" +
        "🛡️ protege contra un efecto\n" +

        "```"
      )
      .setColor(0x8b5cf6)
      .setFooter({ text: "🤖 MECHANIC SYSTEM ONLINE" });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("shop_menu")
        .setPlaceholder("seleccionar módulo")
        .addOptions([
          { label: "Encadenar", value: "chain", emoji: "🧷" },
          { label: "Liberación", value: "release", emoji: "⛓️‍💥" },
          { label: "Renombrar", value: "rename", emoji: "✏️" },
          { label: "Random Name", value: "randomname", emoji: "🎲" },
          { label: "Inmunidad CD", value: "immunity", emoji: "🛡️" },
          { label: "Escudo", value: "shield", emoji: "🛡️" },
          { label: "Permisos Extras", value: "extras", emoji: "🔓" },
          { label: "Cerrar", value: "close", emoji: "❌" }
        ])
    );

    await loading.edit({ embeds: [embed], components: [menu] });
  }
});

// 🟣 INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isStringSelectMenu() && interaction.customId === "shop_menu") {

    if (interaction.values[0] === "close") {
      return interaction.update({ content: "cerrado", embeds: [], components: [] });
    }

    return interaction.reply({
      content: "elige usuario:",
      ephemeral: true,
      components: [
        new ActionRowBuilder().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId(`user_${interaction.values[0]}`)
            .setMaxValues(1)
        )
      ]
    });
  }

  if (interaction.isUserSelectMenu()) {

    const action = interaction.customId.split("_")[1];
    const targetId = interaction.values[0];

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    const immune = IMMUNE_ROLES.some(r => target.roles.cache.has(r));

    let success = false;

    if (action === "chain") {
      if (immune) return interaction.reply({ content: "inmune", ephemeral: true });

      await target.roles.add(PRISON_ROLE);
      setTimeout(() => safeRemoveRole(target, PRISON_ROLE), 30 * 60000);
      success = true;
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      success = true;
    }

    if (action === "immunity") {
      await target.roles.add(IMMUNITY_ROLE);
      setTimeout(() => safeRemoveRole(target, IMMUNITY_ROLE), 60 * 60000);
      success = true;
    }

    if (action === "shield") {
      await target.roles.add(SHIELD_ROLE);
      setTimeout(() => safeRemoveRole(target, SHIELD_ROLE), 60 * 60000);
      success = true;
    }

    if (action === "rename") {
      const modal = new ModalBuilder()
        .setCustomId(`rename_${targetId}`)
        .setTitle("renombrar usuario");

      const input = new TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("nuevo nombre")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    if (action === "randomname") {
      const old = target.nickname || target.user.username;

      if (!originalNames.has(target.id)) {
        originalNames.set(target.id, old);
      }

      let i = 0;
      const interval = setInterval(async () => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        try {
          if (target.manageable) await target.setNickname(name);
        } catch {}
        i++;
        if (i >= 3) clearInterval(interval);
      }, 20000);

      setTimeout(async () => {
        const original = originalNames.get(target.id);
        if (original && target.manageable) {
          await target.setNickname(original).catch(() => {});
        }
        originalNames.delete(target.id);
      }, 60000);

      success = true;
    }

    if (action === "extras") {
      await target.roles.add(EXTRA_ROLE);
      setTimeout(() => safeRemoveRole(target, EXTRA_ROLE), 60 * 60 * 1000);
      success = true;
    }

    if (success) {
      const ok = await consumeToken(buyer);
      if (!ok) {
        return interaction.reply({ content: "❌ no tenías token", ephemeral: true });
      }

      return interaction.update({
        content: "🟣 compra completada correctamente",
        embeds: [],
        components: []
      });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("rename_")) {

    const targetId = interaction.customId.split("_")[1];
    const newName = interaction.fields.getTextInputValue("new_name");

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    const buyer = interaction.member;

    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    const original = target.nickname || target.user.username;

    try {
      if (target.manageable) {
        await target.setNickname(newName);
      }
    } catch {}

    setTimeout(() => {
      if (target.manageable) {
        target.setNickname(original).catch(() => {});
      }
    }, 40 * 60000);

    const ok = await consumeToken(buyer);
    if (!ok) {
      return interaction.reply({ content: "❌ no tenías token", ephemeral: true });
    }

    return interaction.reply({ content: "cambiado", ephemeral: true });
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 mechanic online");
});

client.login(process.env.TOKEN);
