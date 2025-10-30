const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "deletecoupon",

  description: "Delete a coupon (Admin only)",

  async executePrefix(message, args, client) {

    // 🧾 Usage: v!deletecoupon <code>

    const code = args[0];

    if (!code) {

      return message.reply("⚠️ Usage: `v!deletecoupon <code>`");

    }

    // 🔒 Admin Role Check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don’t have permission to use this command!");

    }

    try {

      // 🌐 Send API request

      const response = await axios.post(

        `${process.env.Dash_URL}/api/revokecoupon`,

        { code },

        { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

      );

      // ✅ Success response

      if (response.data.status === "success") {

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Coupon Deleted`)

          .setColor(0xff3333)

          .setURL(`${process.env.Dash_URL}/dashboard`)

          .setDescription(`🗑️ Successfully deleted the coupon: **\`${code}\`**`)

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({ text: `Prefix: v! | Okami.buzz | Vortex Host` });

        await message.reply({ embeds: [embed] });

      } else {

        message.reply("❌ Invalid code or coupon not found!");

      }

    } catch (err) {

      console.error("⚠️ API Error:", err);

      message.reply("🚫 Error connecting to the panel API. Please check DASH_API or URL.");

    }

  },

};