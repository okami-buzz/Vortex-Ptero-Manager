// ======================================================

// ❌ VORTEX DEPLOY - /deleteuser Command

// 👑 Vortex Deploy

// ======================================================

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

dotenv.config();

export default {

  data: new SlashCommandBuilder()

    .setName("deleteuser")

    .setDescription("❌ Delete a user from the panel")

    .addStringOption(option =>

      option

        .setName("value")

        .setDescription("Enter User ID or Email")

        .setRequired(true)

    ),

  async execute(interaction) {

    await interaction.deferReply({ ephemeral: true });

    const value = interaction.options.getString("value");

    let userId = null;

    try {

      // ======================================================

      // 🔍 1. Detect if value is an ID or an Email

      // ======================================================

      if (/^\d+$/.test(value)) {

        // Pure number → ID

        userId = value;

      } else if (value.includes("@")) {

        // Email → Fetch all users & find ID

        const userListRes = await fetch(`${process.env.PTERO_URL}/api/application/users`, {

          headers: {

            "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

            "Accept": "Application/vnd.pterodactyl.v1+json",

          },

        });

        const userListJson = await userListRes.json();

        const users = userListJson.data || [];

        const found = users.find(

          u => u.attributes.email.toLowerCase() === value.toLowerCase()

        );

        if (!found) {

          throw new Error("No user found with this email.");

        }

        userId = found.attributes.id;

      } else {

        throw new Error("Invalid input. Enter a User ID or Email.");

      }

      // ======================================================

      // 📌 2. Fetch user details before deleting

      // ======================================================

      const userRes = await fetch(`${process.env.PTERO_URL}/api/application/users/${userId}`, {

        headers: {

          "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

          "Accept": "Application/vnd.pterodactyl.v1+json",

        },

      });

      const userData = await userRes.json();

      if (!userRes.ok)

        throw new Error(userData.errors ? JSON.stringify(userData.errors) : "User not found");

      const userEmail = userData.attributes.email;

      const serversCount = userData.attributes.relationships?.servers?.data?.length || 0;

      // ======================================================

      // 🗑️ 3. Now delete the user

      // ======================================================

      const deleteRes = await fetch(`${process.env.PTERO_URL}/api/application/users/${userId}`, {

        method: "DELETE",

        headers: {

          "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

          "Accept": "Application/vnd.pterodactyl.v1+json",

        },

      });

      if (deleteRes.status !== 204) {

        const errorJson = await deleteRes.json();

        throw new Error(errorJson.errors ? JSON.stringify(errorJson.errors) : "Deletion error");

      }

      // ======================================================

      // 🎉 4. Success Embed

      // ======================================================

      const embed = new EmbedBuilder()

        .setColor("Green")

        .setTitle("✅ User Deleted Successfully")

        .setDescription(`User **${userEmail}** (ID: ${userId}) has been deleted.`)

        .addFields(

          { name: "📧 Email", value: `\`${userEmail}\``, inline: true },

          { name: "📦 Servers Owned", value: `\`${serversCount}\``, inline: true }

        )

        .setFooter({ text: "Vortex Deploy 👑" })

        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {

      const embed = new EmbedBuilder()

        .setColor("Red")

        .setTitle("❌ Failed to Delete User")

        .setDescription(`Error: ${err.message}`)

        .setFooter({ text: "Vortex Deploy 👑" })

        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    }

  },

};