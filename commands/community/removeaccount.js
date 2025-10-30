const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "removeaccount",

  description: "Remove a user's account (Admin only)",

  async executePrefix(message, args, client) {

    // Usage: v!removeaccount <userID>

    const userID = args[0];

    if (!userID) {

      return message.reply("⚠️ Usage: `v!removeaccount <userID>`");

    }

    // 🔐 Admin Role Check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don’t have permission to use this command!");

    }

    // 🧾 Ask for confirmation

    const confirmMsg = await message.reply(

      `⚠️ Are you sure you want to **delete the account of \`${userID}\`**?\nType \`yes\` to confirm or \`cancel\` to abort (15s timeout).`

    );

    // ⏳ Wait for confirmation

    const filter = (m) => m.author.id === message.author.id;

    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });

    if (!collected.size) {

      return message.reply("⌛ Timeout! Account deletion cancelled.");

    }

    const responseMsg = collected.first().content.toLowerCase();

    if (responseMsg !== "yes") {

      return message.reply("❌ Deletion cancelled.");

    }

    // 🚀 Proceed with deletion

    try {

      const data = { id: userID };

      const response = await axios.post(`${process.env.Dash_URL}/api/removeaccount`, data, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      if (response.data.status === "success") {

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Account Removed`)

          .setColor(0xff3333)

          .setURL(`${process.env.Dash_URL}/dashboard`)

          .setDescription(`🗑️ Successfully **deleted** the account for user ID: \`${userID}\`.`)

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({ text: `Prefix: v! | Okami.buzz | Vortex Host` });

        await message.reply({ embeds: [embed] });

      } else {

        message.reply("❌ Invalid user ID or failed to delete the account.");

      }

    } catch (err) {

      console.error("⚠️ API Error:", err);

      message.reply("🚫 Error connecting to the panel. Please check your DASH_API or Dash_URL.");

    }

  },

};