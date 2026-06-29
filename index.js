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
// 🎨 BOOSTER CUSTOMIZER
const ADMIN_ROLE = "1514290226946641960";

const BOOSTER_COLORS = [
  "1520940230222282872", // Azul
  "1520940500465745951", // Verde
  "1520940358215929996", // Rosa
  "1520940313844387880", // Rojo
  "1520940407779754128"  // Amarillo
];

const BOOSTER_OPTIONS = {
  blue: "1520940230222282872",
  green: "1520940500465745951",
  pink: "1520940358215929996",
  red: "1520940313844387880",
  yellow: "1520940407779754128"
};

// 🛡️ INMUNIDADES
const IMMUNE_ROLES = [
  "1465082323220562013",
  "1426385179575975936",
  "1427393145993429063",
  "1427099549364781127"
];

// 📦 MONGO
if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI no definida");
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

// 📌 SCHEMA TIMERS (MONGO PERSISTENTE)
const roleTimerSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  roleId: String,
  type: String,
  data: Object,
  expiresAt: Date
});

const RoleTimer = mongoose.models.RoleTimer || mongoose.model("RoleTimer", roleTimerSchema);

// ⏱️ COOLDOWN
const cooldown = new Map();

// 🎲 RANDOM NAMES
const randomNames = [
  "Sombra", "Fénix", "Rayo", "Titán", "Nómada",
  "Cazador", "Fantasma", "Vortex", "Draco", "Orion",
  "Lobo", "Ángel", "Demonio", "Neón", "Eco"
];

// 💾 backup nombres
const originalNames = new Map();

// 🧠 TOKEN CONSUMER
async function consumeToken(member) {
  if (!member.roles.cache.has(TOKENS_ROLE)) return false;
  try {
    await member.roles.remove(TOKENS_ROLE);
    return true;
  } catch {
    return false;
  }
}

// 💾 TIMER UNIVERSAL (TODO MONGO)
async function addTimer(member, type, roleId, ms, data = {}) {
  const expiresAt = new Date(Date.now() + ms);

  await RoleTimer.create({
    guildId: member.guild.id,
    userId: member.id,
    roleId,
    type,
    data,
    expiresAt
  });

  if (roleId) {
    await member.roles.add(roleId).catch(() => {});
  }
}

// 🧹 CHECK EXPIRATIONS (REINICIO SAFE)
async function checkTimers() {
  const now = new Date();

  const expired = await RoleTimer.find({ expiresAt: { $lte: now } });

  for (const t of expired) {
    try {
      const guild = await client.guilds.fetch(t.guildId);
      const member = await guild.members.fetch(t.userId).catch(() => null);

      if (!member) continue;

      // ⛓ PRISON
      if (t.type === "prison") {
        await member.roles.remove(t.roleId).catch(() => {});
      }

      // 🛡 IMMUNITY
      if (t.type === "immunity") {
        await member.roles.remove(t.roleId).catch(() => {});
      }

      // 🛡 SHIELD
      if (t.type === "shield") {
        await member.roles.remove(t.roleId).catch(() => {});
      }

      // 🔓 EXTRAS
      if (t.type === "extras") {
        await member.roles.remove(t.roleId).catch(() => {});
      }

      // ✏️ RENAME RESTORE
      if (t.type === "rename") {
        if (member.manageable && t.data?.oldName) {
          await member.setNickname(t.data.oldName).catch(() => {});
        }
      }

      // 🎲 RANDOM NAME RESTORE
      if (t.type === "randomname") {
        if (member.manageable && t.data?.oldName) {
          await member.setNickname(t.data.oldName).catch(() => {});
        }
      }

      await RoleTimer.deleteOne({ _id: t._id });
    } catch {}
  }
}

// 🟣 MESSAGE SYSTEM
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (
  message.channel.id !== ALLOWED_CHANNEL &&
  !message.content.startsWith(">booster")
) return;

  const now = Date.now();
  const cd = cooldown.get(message.author.id) || 0;

  if (now - cd < 5000) return;
  cooldown.set(message.author.id, now);

  if (!message.content.startsWith(">")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  // 🎨 BOOSTER CUSTOMIZER
if (args[0] === "booster") {

  const member = message.member;

  const isAdmin = member.roles.cache.has(ADMIN_ROLE);

  const hasBooster =
    member.roles.cache.has(BOOSTER_ROLE) ||
    BOOSTER_COLORS.some(id => member.roles.cache.has(id));

  if (!isAdmin && !hasBooster) {
    return message.reply("❌ Solo Booster o Administradores pueden usar este comando.");
  }

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle("🎨 BOOSTER CUSTOMIZER")
    .setDescription(
`Selecciona el color de tu Booster.

• Solo puedes tener un color activo.
• Puedes cambiarlo cuando quieras.
• Booster por defecto elimina el color actual.

✨ Uso ilimitado.`
 )
.setImage("https://cdn.discordapp.com/attachments/1402268718360297544/1520983770554175640/3861EA98-7752-4D92-A8B4-70BAC6FA999E.gif");
  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("booster_menu")
      .setPlaceholder("Selecciona un Booster")
      .addOptions([
        {
          label: "Booster Azul",
          value: "blue",
          emoji: "🔵"
        },
        {
          label: "Booster Verde",
          value: "green",
          emoji: "🟢"
        },
        {
          label: "Booster Rosa",
          value: "pink",
          emoji: "🩷"
        },
        {
          label: "Booster Rojo",
          value: "red",
          emoji: "🔴"
        },
        {
          label: "Booster Amarillo",
          value: "yellow",
          emoji: "🟡"
        },
        {
          label: "Booster por defecto",
          value: "default",
          emoji: "♻️"
        }
      ])
  );

  return message.reply({
    embeds: [embed],
    components: [menu]
  });
}

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
        "⏳ 5 min\n" +
        "⚙️ bloquea acceso a interacciones básicas del sistema\n" +
        "🔗 efecto temporal de restricción de canales\n\n" +

        "⛓️ LIBERACIÓN\n" +
        "🪙 1 TOKEN\n" +
        "⚙️ elimina el efecto de encadenamiento\n" +
        "⛓️‍💥 restaura el acceso normal del usuario\n\n" +

        "✏️ RENOMBRAR USUARIO\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 min\n" +
        "⚙️ cambia el nickname del usuario temporalmente\n" +
        "✨ vuelve al nombre original al finalizar\n\n" +

        "🛠️ PERMISOS EXTRAS\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 HORA\n" +
        "⚙️ permisos temporales avanzados\n\n" +

        "🎲 NOMBRES ALEATORIOS\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 min\n" +
        "⚙️ cambia el nombre del usuario constantemente\n\n" +

        "🛡️ INMUNIDAD CD\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 HORA\n" +
        "⚙️ te da inmunidad al modo lento\n\n" +

        "🛡️ ESCUDO\n" +
        "🪙 1 TOKEN\n" +
        "⏳ 1 HORA\n" +
        "⚙️ te protege contra cualquier efecto\n" +

        "```"
      )
      .setColor(0x8b5cf6)
      .setImage("https://cdn.discordapp.com/attachments/1402268718360297544/1519443095379513496/E42BDE84-B055-4A1C-B788-620B7DC904AD.gif")
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

    if (!interaction.member.roles.cache.has(TOKENS_ROLE)) {
      return interaction.reply({
        content: "❌ necesitas un token para abrir la tienda.",
        ephemeral: true
      });
    }

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

  // 🎨 BOOSTER CUSTOMIZER
if (
  interaction.isStringSelectMenu() &&
  interaction.customId === "booster_menu"
) {

  const member = interaction.member;

  const isAdmin = member.roles.cache.has(ADMIN_ROLE);

  const hasBooster =
    member.roles.cache.has(BOOSTER_ROLE) ||
    BOOSTER_COLORS.some(id => member.roles.cache.has(id));

  if (!isAdmin && !hasBooster) {
    return interaction.reply({
      content: "❌ Ya no tienes permiso para usar este menú.",
      ephemeral: true
    });
  }

  // Elimina cualquier color anterior
  const currentColors = BOOSTER_COLORS.filter(id =>
    member.roles.cache.has(id)
  );

  if (currentColors.length) {
    await member.roles.remove(currentColors).catch(() => {});
  }

  // Volver al Booster por defecto
  if (interaction.values[0] === "default") {

    // Si es administrador, solo se elimina el color
    if (isAdmin) {
      return interaction.update({
        content: "♻️ Color eliminado correctamente.",
        embeds: [],
        components: []
      });
    }

    // El Booster normal conserva su rol base, así que solo quitamos el color
    return interaction.update({
      content: "♻️ Has vuelto al Booster por defecto.",
      embeds: [],
      components: []
    });
  }

  // Agregar nuevo color
  await member.roles.add(
    BOOSTER_OPTIONS[interaction.values[0]]
  ).catch(() => {});

  return interaction.update({
    content: "✅ Tu color de Booster fue actualizado.",
    embeds: [],
    components: []
  });

}
  if (interaction.isUserSelectMenu()) {

    const buyer = interaction.member;

    if (!buyer.roles.cache.has(TOKENS_ROLE)) {
      return interaction.reply({
        content: "❌ No tienes tokens para usar la tienda.",
        ephemeral: true
      });
    }

    const action = interaction.customId.split("_")[1];
    const targetId = interaction.values[0];

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (!target) return interaction.reply({ content: "no encontrado", ephemeral: true });

    let success = false;

    if (action === "chain") {
      await addTimer(target, "prison", PRISON_ROLE, 5 * 60000);
      success = true;
    }

    if (action === "release") {
      await target.roles.remove(PRISON_ROLE);
      await RoleTimer.deleteMany({ userId: target.id, roleId: PRISON_ROLE });
      success = true;
    }

    if (action === "immunity") {
      await addTimer(target, "immunity", IMMUNITY_ROLE, 60 * 60000);
      success = true;
    }

    if (action === "shield") {
      await addTimer(target, "shield", SHIELD_ROLE, 60 * 60000);
      success = true;
    }

    if (action === "extras") {
      await addTimer(target, "extras", EXTRA_ROLE, 60 * 60000);
      success = true;
    }

    if (action === "rename") {
      const old = target.nickname || target.user.username;

      await addTimer(target, "rename", null, 60000, {
        oldName: old
      });

      if (target.manageable) {
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
    }

    if (action === "randomname") {
      const old = target.nickname || target.user.username;

      await addTimer(target, "randomname", null, 60000, {
        oldName: old
      });

      let i = 0;
      const interval = setInterval(async () => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        if (target.manageable) await target.setNickname(name).catch(() => {});
        i++;
        if (i >= 3) clearInterval(interval);
      }, 20000);

      success = true;
    }

    if (success) {
      const ok = await consumeToken(buyer);

      if (!ok) return interaction.reply({ content: "❌ sin token", ephemeral: true });

      return interaction.update({
        content: "🟣 compra completada",
        embeds: [],
        components: []
      });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("rename_")) {

    const targetId = interaction.customId.split("_")[1];
    const newName = interaction.fields.getTextInputValue("new_name");

    const target = await interaction.guild.members.fetch(targetId).catch(() => null);

    if (target?.manageable) {
      await target.setNickname(newName).catch(() => {});
    }

    const ok = await consumeToken(interaction.member);

    return interaction.reply({
      content: ok ? "cambiado" : "❌ sin token",
      ephemeral: true
    });
  }
});

client.once(Events.ClientReady, async () => {
  console.log("🤖 mechanic online");
  await checkTimers();
  setInterval(checkTimers, 60000);
});

client.login(process.env.TOKEN);
