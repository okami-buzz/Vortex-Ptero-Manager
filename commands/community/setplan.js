const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "setplan",

  description: "Set a hosting plan for a specific user (Admin only)",

  async executePrefix(message, args, client) {

    // Usage: v!setplan <UserID> <PackageName>

    const userID = args[0];

    const pkg = args[1];

    if (!userID || !pkg) {

      return message.reply("⚠️ Usage: `v!setplan <UserID> <PackageName>`");

    }

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don't have permission to use this command!");

    }

    try {

      // 🧠 Corrected payload key from 'coins' → 'package'

      const data = { id: userID, package: pkg };

      const response = await axios.post(`${process.env.Dash_URL}/api/setplan`, data, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      if (response.data.status === "success") {

        const embed = new EmbedBuilder()

          .setTitle(process.env.Name)

          .setColor(0x11cbcb)

          .setURL(`${process.env.Dash_URL}/dashboard`)

          .setDescription(`✅ Successfully set **plan: \`${pkg}\`** for user [\`${userID}\`]`)

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({

            text: `${message.author.tag} | Prefix: v! | Okami.buzz | Vortex Host`,

          });

        await message.reply({ embeds: [embed] });

      } else {

        message.reply("❌ Invalid data or failed to set plan!");

      }

    } catch (err) {

      console.error(err);

      message.reply("⚠️ Error while connecting to API!");

    }

  },

};