const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "addcoins",

  description: "Add coins to a user (Admin only)",

  async executePrefix(message, args, client) {

    // args[0] = user ID, args[1] = coins

    const Iuser = args[0];

    const Icoins = parseInt(args[1]);

    // check valid inputs

    if (!Iuser || isNaN(Icoins)) {

      return message.reply("⚠️ Usage: `v!addcoins <userID> <coins>`");

    }

    // admin role check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 Insufficient Permissions!");

    }

    try {

      const data = { id: Iuser, coins: Icoins };

      const response = await axios.post(`${process.env.Dash_URL}/api/addcoins`, data, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      if (response.data.status === "success") {

        const embed = new EmbedBuilder()

          .setTitle(process.env.Name)

          .setColor(0x11cbcb)

          .setURL(`${process.env.Dash_URL}/dashboard`)

          .setDescription(

            `✅ Successfully transferred **${Icoins} coins** to [\`${Iuser}\`]`

          )

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({ text: `${message.author.tag} | Made By NicoRuizDev` });

        message.reply({ embeds: [embed] });

      } else {

        message.reply("❌ Invalid request or user ID!");

      }

    } catch (err) {

      console.error(err);

      message.reply("⚠️ Error while connecting to API!");

    }

  },

};