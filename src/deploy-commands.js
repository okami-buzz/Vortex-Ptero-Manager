// ======================================================

// ⚡ VORTEX DEPLOY - Deploy Commands Script

// Made by Okami | Asia/Kolkata

// ======================================================

import { REST, Routes } from "discord.js";

import fs from "fs";

import path from "path";

import dotenv from "dotenv";

dotenv.config();

const commands = [];

const commandsPath = path.join(process.cwd(), "src/commands");

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

// Load commands

for (const file of commandFiles) {

  const filePath = path.join(commandsPath, file);

  const command = await import(`file://${filePath}`);

  if (command.default?.data) {

    commands.push(command.default.data.toJSON());

  }

}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {

  try {

    console.log(`⚡ Purging old commands...`);

    // 1️⃣ Purge old guild commands

    if (process.env.GUILD_ID) {

      await rest.put(

        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),

        { body: [] }

      );

      console.log("✅ Old guild commands cleared.");

    }

    // Optional: purge global commands (comment out if not needed)

    // if (process.env.DEPLOY_GLOBAL === "true") {

    //   await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });

    //   console.log("✅ Old global commands cleared.");

    // }

    // 2️⃣ Deploy fresh commands

    console.log(`⚡ Deploying ${commands.length} fresh commands...`);

    if (process.env.GUILD_ID) {

      await rest.put(

        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),

        { body: commands }

      );

      console.log(`✅ Successfully deployed commands to guild ID: ${process.env.GUILD_ID}`);

    }

    if (process.env.DEPLOY_GLOBAL === "true") {

      await rest.put(

        Routes.applicationCommands(process.env.CLIENT_ID),

        { body: commands }

      );

      console.log("✅ Successfully deployed commands globally");

    }

  } catch (error) {

    console.error("❌ Error deploying commands:", error);

  }

})();
