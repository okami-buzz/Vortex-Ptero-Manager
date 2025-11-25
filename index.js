// ======================================================

// 🚀 VORTEX DEPLOY - Discord Bot

// ⚡ Made by Okami | Timezone: Asia/Kolkata

// ======================================================

import { Client, Collection, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder } from "discord.js";

import dotenv from "dotenv";

import fs from "fs";

import path from "path";

import chalk from "chalk";

import moment from "moment-timezone";

import mongoose from "mongoose";

dotenv.config();

const __dirname = path.resolve();

// ======================================================

// 🤖 CLIENT

// ======================================================

const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.GuildMembers,

    GatewayIntentBits.DirectMessages

  ],

  partials: [Partials.Message, Partials.Channel]

});

client.commands = new Collection();

const log = {

  info: (msg) => console.log(chalk.cyanBright(`[INFO] ${msg}`)),

  success: (msg) => console.log(chalk.greenBright(`[SUCCESS] ${msg}`)),

  warn: (msg) => console.log(chalk.yellowBright(`[WARN] ${msg}`)),

  error: (msg) => console.log(chalk.redBright(`[ERROR] ${msg}`)),

};

// ======================================================

// 📦 COMMAND HANDLER

// ======================================================

const commandsPath = path.join(__dirname, "src/commands");

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

const commands = [];

for (const file of commandFiles) {

  const filePath = path.join(commandsPath, file);

  const command = (await import(`file://${filePath}`)).default;

  if ("data" in command && "execute" in command) {

    // Prevent duplicates

    if (commands.some(c => c.name === command.data.name)) {

      log.warn(`⚠️ Duplicate command name skipped: ${command.data.name}`);

      continue;

    }

    client.commands.set(command.data.name, command);

    commands.push(command.data.toJSON());

    log.success(`Loaded Command ➜ ${command.data.name}`);

  } else {

    log.warn(`⚠️ Skipped invalid command file: ${file}`);

  }

}

// ======================================================

// 🌐 DEPLOY SLASH COMMANDS (SAFE, DUPLICATE-PROOF)

// ======================================================

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

const deployCommands = async () => {

  try {

    console.log(`⚡ Deploying ${commands.length} commands to guild...`);

    // Clear old guild commands first

    await rest.put(

      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),

      { body: [] }

    );

    // Wait a bit to avoid race conditions

    await new Promise(r => setTimeout(r, 2000));

    // Deploy fresh commands

    await rest.put(

      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),

      { body: commands }

    );

    log.success(`✅ Commands successfully deployed to guild ID: ${process.env.GUILD_ID}`);

  } catch (err) {

    log.error("❌ Command deployment failed:", err);

  }

};

// ======================================================

// ⚡ DATABASE CONNECTION

// ======================================================

if (process.env.MONGO_URI) {

  try {

    await mongoose.connect(process.env.MONGO_URI, {

      useNewUrlParser: true,

      useUnifiedTopology: true

    });

    log.success("🗄️ MongoDB Connected Successfully!");

  } catch (error) {

    log.error(`MongoDB Connection Failed: ${error.message}`);

  }

}

// ======================================================

// 🤖 READY EVENT

// ======================================================

client.once("ready", async () => {

  const time = moment().tz(process.env.TIMEZONE || "Asia/Kolkata").format("HH:mm:ss");

  log.success(`🟢 ${client.user.tag} is Online | Local Time: ${time}`);

  client.user.setActivity("Vortex Deploy ⚡", { type: 3 });

  // Auto deploy commands safely on ready

  await deployCommands();

});

// ======================================================

// 🚫 AUTO-LEAVE UNAUTHORIZED SERVERS

// ======================================================

client.on("guildCreate", async (guild) => {

  const allowedGuild = process.env.ALLOWED_GUILD;

  if (guild.id !== allowedGuild) {

    log.warn(`⛔ Unauthorized Guild Detected: ${guild.name}`);

    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()

      .setTitle("⚠ Unauthorized Server")

      .setDescription(

        `Hello!\n\nYour server **${guild.name}** is not authorized to use this bot.\n\nFor security reasons, the bot has **automatically left** your server.\n\nIf you need access, please contact support.`

      )

      .setColor("Red")

      .setFooter({ text: "Vortex Deploy 👑" })

      .setTimestamp();

    if (owner) owner.send({ embeds: [embed] }).catch(() => {});

    await guild.leave().catch(() => {});

    return;

  }

  log.success(`🟢 Joined Authorized Guild: ${guild.name}`);

});

// ======================================================

// 🔐 OWNER-ONLY COMMAND PROTECTION (Multiple IDs Supported)

// ======================================================

const ownerIDs = process.env.OWNER_ID.split(",").map(id => id.trim());

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  if (!ownerIDs.includes(interaction.user.id)) {

    const embed = new EmbedBuilder()

      .setColor("Red")

      .setTitle("⛔ Access Denied")

      .setDescription("You are not authorized to use this bot.\nOnly the **bot owner(s)** can use commands.")

      .setFooter({ text: "Vortex Deploy 👑" })

      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });

  }

  try {

    await command.execute(interaction, client);

  } catch (error) {

    log.error(error);

    await interaction.reply({

      content: "❌ An unexpected error occurred.",

      ephemeral: true,

    });

  }

});

// ======================================================

// 🔐 BOT LOGIN

// ======================================================

client.login(process.env.BOT_TOKEN)

  .then(() => log.info("✨ Logging in..."))

  .catch((err) => log.error(`❌ Login Failed: ${err.message}`));

// ======================================================

// 🧠 FOOTER BRANDING & ERROR HANDLING

// ======================================================

process.on("unhandledRejection", (err) => log.error(`Unhandled Rejection: ${err}`));

process.on("uncaughtException", (err) => log.error(`Uncaught Exception: ${err}`));