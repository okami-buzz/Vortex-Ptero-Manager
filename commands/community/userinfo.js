const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "userinfo",

  description: "Shows a user's resource stats from the hosting panel.",

  async executePrefix(message, args, client) {

    const id = args[0] || message.author.id; // agar user ne id nahi di toh apni id lega

    if (isNaN(id)) {

      return message.reply("⚠️ Please enter a valid numeric User ID!");

    }

    try {

      const response = await axios.get(`${process.env.Dash_URL}/api/userinfo/`, {

        params: { id },

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const data = response.data;

      if (!data || data.status === "invalid id") {

        return message.reply("❌ Invalid User ID or user not found!");

      }

      // ✅ Safe resource parsing

      const ram =

        (data.package?.ram || 0) +

        (data.extra?.ram || 0) +

        (data.j4r?.ram || 0);

      const disk =

        (data.package?.disk || 0) +

        (data.extra?.disk || 0) +

        (data.j4r?.disk || 0);

      const cpu =

        (data.package?.cpu || 0) +

        (data.extra?.cpu || 0) +

        (data.j4r?.cpu || 0);

      const servers =

        (data.package?.servers || 0) +

        (data.extra?.servers || 0) +

        (data.j4r?.servers || 0);

      const embed = new EmbedBuilder()

        .setTitle(`${process.env.Name} — User Info`)

        .setColor(0x11cbcb)

        .setURL(`${process.env.Dash_URL}/dashboard`)

        .setDescription("📊 **Current Resource Details**")

        .setThumbnail(process.env.Icon)

        .addFields(

          { name: "💾 RAM", value: `\`\`\`${ram} MB\`\`\``, inline: true },

          { name: "📂 DISK", value: `\`\`\`${disk} MB\`\`\``, inline: true },

          { name: "⚙️ CPU", value: `\`\`\`${cpu}%\`\`\``, inline: true },

          { name: "🖥️ SERVERS", value: `\`\`\`${servers}\`\`\``, inline: true },

          { name: "👤 User ID", value: `\`\`\`${id}\`\`\`` }

        )

        .setTimestamp()

        .setFooter({

          text: `Requested by ${message.author.tag} | Prefix: v! | Okami.buzz | Vortex Host`,

        });

      await message.reply({ embeds: [embed] });

    } catch (err) {

      console.error(err);

      message.reply("⚠️ Error fetching user info. Please check the panel or API connection!");

    }

  },

};