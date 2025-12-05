// ======================================================

// 🛠️ CYRO DEPLOY – /createserver (Fully Fixed)

// 👑 Footer: Cyro Deploy 👑

// ======================================================

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

dotenv.config();

export default {

  data: new SlashCommandBuilder()

    .setName("createserver")

    .setDescription("🛠️ Create a new server on Pterodactyl")

    .addStringOption(opt =>

      opt.setName("name").setDescription("Server name").setRequired(true)

    )

    .addStringOption(opt =>

      opt.setName("description").setDescription("Server description").setRequired(true)

    )

    .addStringOption(opt =>

      opt.setName("email").setDescription("User email").setRequired(true)

    )

    .addIntegerOption(opt =>

      opt.setName("ram").setDescription("RAM in MB").setRequired(true)

    )

    .addIntegerOption(opt =>

      opt.setName("disk").setDescription("Disk in MB").setRequired(true)

    )

    .addIntegerOption(opt =>

      opt.setName("cpu").setDescription("CPU %").setRequired(true)

    )

    .addIntegerOption(opt =>

      opt

        .setName("egg")

        .setDescription("1 Sponge • 2 Bungee • 3 Paper • 4 Forge • 5 Vanilla")

        .setRequired(true)

    ),

  async execute(interaction) {

    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString("name");

    const description = interaction.options.getString("description");

    const email = interaction.options.getString("email");

    const ram = interaction.options.getInteger("ram");

    const disk = interaction.options.getInteger("disk");

    const cpu = interaction.options.getInteger("cpu");

    const eggChoice = interaction.options.getInteger("egg");

    // 🥚 EGGS + DOCKER IMAGES

    const eggMap = {

      1: { eggId: 1, docker: "ghcr.io/pterodactyl/sponge:latest" },

      2: { eggId: 2, docker: "ghcr.io/pterodactyl/bungeecord:latest" },

      3: { eggId: 3, docker: "ghcr.io/pterodactyl/paper:latest" },

      4: { eggId: 4, docker: "ghcr.io/pterodactyl/forge:latest" },

      5: { eggId: 5, docker: "ghcr.io/pterodactyl/vanilla:latest" }

    };

    const chosen = eggMap[eggChoice] ?? eggMap[5];

    try {

      // -----------------------------

      // 1️⃣ USER LOOKUP BY EMAIL

      // -----------------------------

      const userLookup = await fetch(

        `${process.env.PTERO_URL}/api/application/users?filter[email]=${email}`,

        {

          headers: {

            Authorization: `Bearer ${process.env.PTERO_API_KEY}`,

            Accept: "application/json"

          }

        }

      );

      const lookupData = await userLookup.json();

      if (!lookupData.data || lookupData.data.length === 0) {

        throw new Error("User with this email does not exist.");

      }

      const userId = lookupData.data[0].attributes.id;

      // -----------------------------

      // 2️⃣ SERVER CREATE PAYLOAD (FULLY FIXED)

      // -----------------------------

      const payload = {

        name,

        description,

        user: userId,

        egg: chosen.eggId,

        docker_image: chosen.docker,

        // 🧠 FIXED STARTUP

        startup: `java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}`,

        limits: {

          memory: ram,

          swap: 0,

          disk: disk,

          io: 500,        // REQUIRED ✓

          cpu: cpu

        },

        feature_limits: {

          databases: 1,

          allocations: 1,

          backups: 1

        },

        environment: {

          SERVER_JARFILE: "server.jar",

          SERVER_MEMORY: ram,

          BUILD_NUMBER: "latest",

          VERSION: "latest"

        },

        deploy: {

          locations: [1],

          dedicated_ip: false,

          port_range: []

        },

        start_on_completion: true

      };

      // -----------------------------

      // 3️⃣ API REQUEST — CREATE SERVER

      // -----------------------------

      const res = await fetch(

        `${process.env.PTERO_URL}/api/application/servers`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${process.env.PTERO_API_KEY}`,

            Accept: "application/json"

          },

          body: JSON.stringify(payload)

        }

      );

      const data = await res.json();

      if (!res.ok) {

        throw new Error(JSON.stringify(data.errors));

      }

      const serverId = data.attributes.id;

      const embed = new EmbedBuilder()

        .setColor("Green")

        .setTitle("✅ Server Created Successfully")

        .setDescription(`Server **${name}** created for **${email}**`)

        .addFields(

          { name: "🆔 Server ID", value: `\`${serverId}\`` },

          { name: "📦 RAM", value: `\`${ram} MB\``, inline: true },

          { name: "💾 DISK", value: `\`${disk} MB\``, inline: true },

          { name: "⚙ CPU", value: `\`${cpu}%\``, inline: true }

        )

        .setFooter({ text: "Cyro Deploy 👑" });

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {

      const embed = new EmbedBuilder()

        .setColor("Red")

        .setTitle("❌ Server Creation Failed")

        .setDescription(`\`\`\`${err.message}\`\`\``)

        .setFooter({ text: "Cyro Deploy 👑" });

      return interaction.editReply({ embeds: [embed] });

    }

  }

};
