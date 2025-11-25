// ======================================================
// ❌ VORTEX DEPLOY - /deleteserver Command
// ⚡ Made by Okami | Asia/Kolkata
// ======================================================

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export default {
  data: new SlashCommandBuilder()
    .setName("deleteserver")
    .setDescription("❌ Delete a server from the panel")
    .addIntegerOption(option =>
      option.setName("serverid")
        .setDescription("Server ID to delete")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const serverId = interaction.options.getInteger("serverid");

    try {
      // Optional: fetch server info first for embed
      const serverRes = await fetch(`${process.env.PTERO_URL}/api/application/servers/${serverId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,
          "Accept": "Application/vnd.pterodactyl.v1+json"
        }
      });
      const serverData = await serverRes.json();

      if (!serverRes.ok) throw new Error(serverData.errors ? JSON.stringify(serverData.errors) : "Server not found");

      const serverName = serverData.attributes.name;
      const serverNode = serverData.attributes.node;
      const serverEgg = serverData.attributes.egg;
      const serverStatus = serverData.attributes.status;

      // Delete request
      const res = await fetch(`${process.env.PTERO_URL}/api/application/servers/${serverId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,
          "Accept": "Application/vnd.pterodactyl.v1+json"
        }
      });

      if (res.status === 204) {
        const embed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Server Deleted Successfully")
          .setDescription(`Server **${serverName}** (ID: ${serverId}) has been deleted.`)
          .addFields(
            { name: "📍 Node", value: `\`${serverNode}\``, inline: true },
            { name: "📦 Egg/Type", value: `\`${serverEgg}\``, inline: true },
            { name: "⏱️ Status before deletion", value: `\`${serverStatus}\``, inline: true }
          )
          .setFooter({ text: "⚡ Made by Okami | Asia/Kolkata" })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.errors ? JSON.stringify(errorData.errors) : "Unknown error during deletion");
      }

    } catch (err) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("❌ Failed to Delete Server")
        .setDescription(`Error: ${err.message}`)
        .setFooter({ text: "⚡ Made by Okami | Vortex Deploy 👑" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};