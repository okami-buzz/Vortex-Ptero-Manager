const { EmbedBuilder } = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "restart",

  description: "Restarts the bot (Admin only)",

  async executePrefix(message, args, client) {

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don't have permission to restart the bot!");

    }

    const embed = new EmbedBuilder()

      .setTitle("🔁 Bot Restarting...")

      .setColor(0xffc107)

      .setDescription("The bot is restarting. Please wait a few seconds...")

      .setThumbnail(client.user.displayAvatarURL())

      .setFooter({ text: "Vortex Host | Restart Initiated" })

      .setTimestamp();

    await message.reply({ embeds: [embed] });

    console.log("🔄 Restart command triggered by:", message.author.tag);

    // Optional: log to your logs channel

    try {

      const logChannel = await client.channels.fetch("1430939327533158541");

      await logChannel.send(`🌀 Bot restart initiated by **${message.author.tag}**`);

    } catch (err) {

      console.warn("⚠️ Couldn't log restart event:", err.message);

    }

    // Graceful shutdown

    setTimeout(() => {

      process.exit(0); // This will trigger restart if hosted on process manager (like pm2 / node monitor)

    }, 3000);

  },

};