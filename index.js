const {

  Client,

  GatewayIntentBits,

  Collection,

  EmbedBuilder,

  ActionRowBuilder,

  ButtonBuilder,

  ButtonStyle

} = require("discord.js");

const fs = require("fs");

require("dotenv").config();

// 🧩 Client Setup

const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMembers,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.MessageContent,

  ],

});

// 🔹 Command Collection

client.commands = new Collection();

client.cooldowns = new Collection(); // 🕒 Cooldowns storage

const prefix = "v!";

// 🔹 Load Commands

const commandDir = "./commands/Community";

if (!fs.existsSync(commandDir)) fs.mkdirSync(commandDir, { recursive: true });

const commandFiles = fs.readdirSync(commandDir).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {

  try {

    const command = require(`${commandDir}/${file}`);

    if (command.name && typeof command.executePrefix === "function") {

      client.commands.set(command.name.toLowerCase(), command);

      console.log(`✅ Loaded command: ${command.name}`);

    } else {

      console.log(`⚠️ Skipped ${file} (missing name or executePrefix)`);

    }

  } catch (err) {

    console.error(`❌ Error loading ${file}:`, err);

  }

}

// 🔹 Message Handler

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const msg = message.content.toLowerCase().trim();

  // ⚙️ Auto Panel Link Responder

  const triggers = ["panel", "panel link", "hosting panel", "dashboard link", "vortex panel"];

  const exactMatch = triggers.some(t => msg === t || msg.includes(`${t}?`));

  if (exactMatch) {

    const panelEmbed = new EmbedBuilder()

      .setTitle(`${process.env.Name || "Vortex Host"} — Secure Panel Access 🔒`)

      .setDescription(

        `Access your hosting dashboard securely below.\n\n🛡️ Protected with **Cloudflare**, **reCAPTCHA**, and **DDoS Protection** for maximum safety.\n\n> **Note:** You can only login using credentials provided by the **Vortex Host Staff Team.**`

      )

      .setColor(0x11cbcb)

      .setThumbnail(process.env.Icon || "https://i.imgur.com/x8dM5wB.png")

      .setFooter({ text: "Vortex Host | Secure Cloud Panel" })

      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(

      new ButtonBuilder()

        .setLabel("🌐 Open Panel")

        .setStyle(ButtonStyle.Link)

        .setURL(process.env.Dash_URL)

    );

    await message.channel.send({ embeds: [panelEmbed], components: [button] });

    return;

  }

  // 🔸 Command Handling

  if (!msg.startsWith(prefix.toLowerCase())) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  // 🕒 Cooldown System (5 seconds)

  const now = Date.now();

  const cooldowns = client.cooldowns;

  if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());

  const timestamps = cooldowns.get(command.name);

  const cooldownAmount = 5000; // 5 seconds

  if (timestamps.has(message.author.id)) {

    const expiration = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expiration) {

      const remaining = ((expiration - now) / 1000).toFixed(1);

      const cooldownEmbed = new EmbedBuilder()

        .setTitle("⏳ Slow Down!")

        .setDescription(`Please wait **${remaining}s** before using this command again.`)

        .setColor(0xffc107)

        .setFooter({ text: "Anti-spam system active | Vortex Host" });

      return message.reply({ embeds: [cooldownEmbed] });

    }

  }

  timestamps.set(message.author.id, now);

  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {

    console.log(`📘 ${message.author.tag} used command: ${prefix}${commandName}`);

    await command.executePrefix(message, args, client);

  } catch (error) {

    console.error(`❌ Error executing ${commandName}:`, error);

    const errorEmbed = new EmbedBuilder()

      .setTitle("⚠️ Command Error")

      .setColor(0xff4444)

      .setDescription(`An error occurred while executing \`${prefix}${commandName}\`.`)

      .addFields({ name: "Error", value: `\`\`\`${error.message}\`\`\`` })

      .setFooter({ text: "Please report this to the developer." })

      .setTimestamp();

    await message.reply({ embeds: [errorEmbed] }).catch(() => {});

  }

});

// 🔹 Ready Event

client.once("ready", () => {

  console.log(`🤖 Logged in as ${client.user.tag}`);

  client.user.setActivity("Vortex Host | v!help", { type: 0 });

  const logChannelId = process.env.LOG_CHANNEL_ID || "1430939327533158541";

  const logChannel = client.channels.cache.get(logChannelId);

  if (logChannel) {

    const readyEmbed = new EmbedBuilder()

      .setTitle("✅ Bot Started")

      .setDescription(`**${client.user.tag}** is now online and ready!`)

      .setColor(0x00ff88)

      .setTimestamp();

    logChannel.send({ embeds: [readyEmbed] }).catch(() => {});

  }

});

// 🔹 Error & Shutdown Handlers

process.on("unhandledRejection", (error) => console.error("🚫 Unhandled Promise Rejection:", error));

process.on("uncaughtException", (error) => console.error("🔥 Uncaught Exception:", error));

process.on("SIGINT", () => {

  console.log("🛑 Bot shutting down gracefully...");

  client.destroy();

  process.exit(0);

});

// 🔹 Login

client.login(process.env.TOKEN);