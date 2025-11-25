// ======================================================

// ⚡ VORTEX DEPLOY - /changepass Command

// Made by Okami | Vortex Deploy 👑

// ======================================================

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

import moment from "moment-timezone";

dotenv.config();

export default {

  data: new SlashCommandBuilder()

    .setName("changepass")

    .setDescription("🔑 Change a user's panel password using their email")

    .addStringOption(option =>

      option.setName("email")

        .setDescription("User's panel email")

        .setRequired(true)

    )

    .addStringOption(option =>

      option.setName("newpass")

        .setDescription("New password to set")

        .setRequired(true)

    )

    .addUserOption(option =>

      option.setName("user")

        .setDescription("Optional: Tag Discord user to DM new details")

        .setRequired(false)

    ),

  async execute(interaction) {

    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString("email");

    const newPass = interaction.options.getString("newpass");

    const discordUser = interaction.options.getUser("user");

    try {

      // 1️⃣ Fetch the user by email

      const usersRes = await fetch(

        `${process.env.PTERO_URL}/api/application/users`,

        {

          headers: {

            "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

            "Accept": "Application/vnd.pterodactyl.v1+json",

          },

        }

      );

      const usersJson = await usersRes.json();

      const users = usersJson.data || [];

      const targetUser = users.find(u => u.attributes.email === email);

      if (!targetUser) {

        throw new Error(`❌ No panel user found with email: ${email}`);

      }

      const userId = targetUser.attributes.id;

      const username = targetUser.attributes.username;

      const firstName = targetUser.attributes.first_name;

      const lastName = targetUser.attributes.last_name;

      // 2️⃣ Update password

      const body = {

        email,

        username,

        first_name: firstName,

        last_name: lastName,

        password: newPass,

      };

      const updateRes = await fetch(

        `${process.env.PTERO_URL}/api/application/users/${userId}`,

        {

          method: "PATCH",

          headers: {

            "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

            "Content-Type": "application/json",

            "Accept": "Application/vnd.pterodactyl.v1+json",

          },

          body: JSON.stringify(body),

        }

      );

      if (!updateRes.ok) {

        const errJson = await updateRes.json();

        throw new Error(JSON.stringify(errJson.errors || errJson));

      }

      // 3️⃣ Success embed

      const time = moment().tz(process.env.TIMEZONE || "Asia/Kolkata").format("HH:mm:ss");

      const embed = new EmbedBuilder()

        .setColor("Green")

        .setTitle("✅ Password Changed Successfully")

        .addFields(

          { name: "👤 Username", value: `\`${username}\``, inline: true },

          { name: "📧 Email", value: `\`${email}\``, inline: true },

          { name: "🔑 New Password", value: `\`${newPass}\``, inline: true }

        )

        .setFooter({ text: `Made By Okami | Vortex Deploy 👑 | ${time}` });

      await interaction.editReply({ embeds: [embed] });

      // 4️⃣ DM the Discord user if provided

      if (discordUser) {

        const dmEmbed = new EmbedBuilder()

          .setColor("Aqua")

          .setTitle("🔐 Your Hosting Panel Account Updated")

          .setDescription(`Your panel password has been updated successfully 🎉`)

          .addFields(

            { name: "👤 Username", value: `\`${username}\``, inline: false },

            { name: "📧 Email", value: `\`${email}\``, inline: false },

            { name: "🔑 New Password", value: `\`${newPass}\``, inline: false },

            { name: "🌐 Panel URL", value: `${process.env.PTERO_URL}/`, inline: false }

          )

          .setFooter({ text: `Made By Okami | Vortex Deploy 👑 | ${time}` });

        await discordUser.send({ embeds: [dmEmbed] }).catch(() => {});

      }

    } catch (err) {

      const time = moment().tz(process.env.TIMEZONE || "Asia/Kolkata").format("HH:mm:ss");

      const embed = new EmbedBuilder()

        .setColor("Red")

        .setTitle("❌ Failed to Change Password")

        .setDescription(`Error: ${err.message}`)

        .setFooter({ text: `Made By Okami | Vortex Deploy 👑 | ${time}` });

      await interaction.editReply({ embeds: [embed] });

    }

  },

};