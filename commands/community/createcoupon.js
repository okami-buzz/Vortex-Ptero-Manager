const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "createcoupon",

  description: "Create a new coupon (Admin only)",

  async executePrefix(message, args, client) {

    // 📦 Usage: v!createcoupon <ram> <disk> <cpu> <servers> <coins> [code]

    const [ram, disk, cpu, servers, coins, code] = args;

    // 🔒 Admin check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don’t have permission to use this command!");

    }

    // 🧠 Validate inputs

    const userram = parseInt(ram);

    const userdisk = parseInt(disk);

    const usercpu = parseInt(cpu);

    const userservers = parseInt(servers);

    const usercoins = parseInt(coins);

    if ([userram, userdisk, usercpu, userservers, usercoins].some(isNaN)) {

      return message.reply("⚠️ Usage: `v!createcoupon <ram> <disk> <cpu> <servers> <coins> [code]`");

    }

    try {

      const data = { ram: userram, disk: userdisk, cpu: usercpu, servers: userservers, coins: usercoins };

      if (code) data.code = code;

      // 🌐 Send request to API

      const res = await axios.post(`${process.env.Dash_URL}/api/createcoupon`, data, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      // 💬 Success Embed

      const embed = new EmbedBuilder()

        .setTitle(process.env.Name)

        .setColor(0x11cbcb)

        .setURL(`${process.env.Dash_URL}/dashboard`)

        .setDescription(`✅ Successfully created coupon: [\`${res.data.code}\`]`)

        .setThumbnail(process.env.Icon)

        .addFields(

          { name: "💾 RAM", value: `\`\`\`${ram} MB\`\`\``, inline: true },

          { name: "🧱 DISK", value: `\`\`\`${disk} MB\`\`\`` },

          { name: "⚙️ CPU", value: `\`\`\`${cpu}%\`\`\`` },

          { name: "🖥️ SERVERS", value: `\`\`\`${servers}\`\`\`` },

          { name: "💰 COINS", value: `\`\`\`${coins}\`\`\`` }

        )

        .setTimestamp()

        .setFooter({ text: `Prefix: v! | Okami.buzz | Vortex Host` });

      await message.reply({ embeds: [embed] });

    } catch (err) {

      console.error(err);

      message.reply("❌ Failed to create coupon — please check your panel or API key.");

    }

  },

};