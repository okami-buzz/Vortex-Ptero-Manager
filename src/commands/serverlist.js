// ======================================================

// 👥 VORTEX DEPLOY - /userslist (Correct Server Count)

// 👑 Footer: Vortex Deploy 👑

// ======================================================

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

dotenv.config();

export default {

  data: new SlashCommandBuilder()

    .setName("userslist")

    .setDescription("📋 List all users with correct server count"),

  async execute(interaction) {

    await interaction.deferReply();

    try {

      // 1️⃣ Fetch all users

      const usersRes = await fetch(

        `${process.env.PTERO_URL}/api/application/users`,

        {

          headers: {

            Authorization: `Bearer ${process.env.PTERO_API_KEY}`,

            Accept: "application/json",

          },

        }

      );

      const usersJson = await usersRes.json();

      const users = usersJson.data || [];

      // 2️⃣ Fetch all servers

      const serversRes = await fetch(

        `${process.env.PTERO_URL}/api/application/servers`,

        {

          headers: {

            Authorization: `Bearer ${process.env.PTERO_API_KEY}`,

            Accept: "application/json",

          },

        }

      );

      const serversJson = await serversRes.json();

      const servers = serversJson.data || [];

      // 3️⃣ Count servers for each user

      const countMap = {};

      servers.forEach(s => {

        const uid = s.attributes.user;

        countMap[uid] = (countMap[uid] || 0) + 1;

      });

      // 4️⃣ Build user list string

      const list = users

        .map(u => {

          const a = u.attributes;

          return (

            `👤 **${a.username}** (ID: ${a.id})\n` +

            `📧 Email: \`${a.email}\`\n` +

            `🖥️ Servers: \`${countMap[a.id] || 0}\`\n` +

            `🛡️ Admin: \`${a.root_admin ? "Yes" : "No"}\``

          );

        })

        .join("\n\n");

      const embed = new EmbedBuilder()

        .setColor("Aqua")

        .setTitle("📋 User List (Correct Server Count)")

        .setDescription(list || "No users found.")

        .setFooter({ text: "Vortex Deploy 👑" })

        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {

      const embed = new EmbedBuilder()

        .setColor("Red")

        .setTitle("❌ Error Fetching Users")

        .setDescription(`\`\`\`${err.message}\`\`\``)

        .setFooter({ text: "Vortex Deploy 👑" });

      await interaction.editReply({ embeds: [embed] });

    }

  },

};