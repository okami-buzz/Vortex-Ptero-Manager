const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "setresources",

  description: "Set custom resources for a user (Admin only)",

  async executePrefix(message, args, client) {

    // ✅ Usage: v!setresources <UserID> <RAM> <DISK> <CPU> <SERVERS>

    const [id, ram, disk, cpu, servers] = args;

    if (!id || !ram || !disk || !cpu || !servers) {

      return message.reply(

        "⚠️ Usage: `v!setresources <UserID> <RAM> <DISK> <CPU> <SERVERS>`"

      );

    }

    // ✅ Permission check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don't have permission to use this command!");

    }

    // ✅ Validate numeric inputs

    if ([ram, disk, cpu, servers].some((n) => isNaN(n))) {

      return message.reply("⚠️ RAM, DISK, CPU & SERVERS must be numbers!");

    }

    try {

      const data = {

        id,

        ram: parseInt(ram),

        disk: parseInt(disk),

        cpu: parseInt(cpu),

        servers: parseInt(servers),

      };

      const response = await axios.post(`${process.env.Dash_URL}/api/setresources`, data, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      if (response.data.status === "success") {

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Resources Updated`)

          .setColor(0x00ff9d)

          .setURL(`${process.env.Dash_URL}/dashboard`)

          .setDescription(`✅ Successfully updated resources for user: \`${id}\``)

          .addFields(

            { name: "💾 RAM", value: `${ram} MB`, inline: true },

            { name: "📂 Disk", value: `${disk} MB`, inline: true },

            { name: "⚙️ CPU", value: `${cpu}%`, inline: true },

            { name: "🖥️ Servers", value: `${servers}`, inline: true }

          )

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({

            text: `Updated by ${message.author.tag} | Prefix: v! | Okami.buzz | Vortex Host`,

          });

        await message.reply({ embeds: [embed] });

      } else {

        message.reply("❌ Invalid response from API or failed to update resources!");

      }

    } catch (err) {

      console.error(err);

      message.reply("⚠️ Error while connecting to API!");

    }

  },

};