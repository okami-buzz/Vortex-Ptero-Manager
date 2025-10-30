const axios = require("axios");

const { EmbedBuilder } = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "createserver",

  description: "Create a new Minecraft server (Admin only)",

  async executePrefix(message, args, client) {

    // 🔒 Admin check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don’t have permission to use this command!");

    }

    // 📥 Validate args

    if (args.length < 6) {

      return message.reply(

        "⚠️ Usage: `v!createserver <email> <ram> <disk> <cpu> <software> <servername>`"

      );

    }

    const [email, ram, disk, cpu, software, ...nameParts] = args;

    const name = nameParts.join(" ");

    const validSoftwares = ["paper", "forge", "vanilla", "sponge", "bungeecord"];

    if (!validSoftwares.includes(software.toLowerCase())) {

      return message.reply(

        "⚠️ Invalid software! Use one of: `paper`, `forge`, `vanilla`, `sponge`, `bungeecord`"

      );

    }

    // 🧠 Convert values

    const ramInt = parseInt(ram);

    const diskInt = parseInt(disk);

    const cpuInt = parseInt(cpu);

    if ([ramInt, diskInt, cpuInt].some(isNaN)) {

      return message.reply("⚠️ Invalid resource values! Use numbers only.");

    }

    try {

      // 🌐 Send API request

      const response = await axios.post(

        `${process.env.Dash_URL}/api/createserver`,

        {

          email,

          ram: ramInt,

          disk: diskInt,

          cpu: cpuInt,

          software: software.toLowerCase(),

          name,

          backups: "manual",

        },

        { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

      );

      const data = response.data;

      if (data.status === "success") {

        // ✅ Success Embed

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Server Created`)

          .setColor(0x00ff99)

          .setDescription(`✅ Successfully created a new server on your panel!`)

          .addFields(

            { name: "📧 Email", value: `\`${email}\``, inline: true },

            { name: "🧩 Name", value: `\`${name}\``, inline: true },

            { name: "🖥️ Software", value: `\`${software}\``, inline: true },

            { name: "💾 RAM", value: `\`${ramInt} MB\``, inline: true },

            { name: "📂 Disk", value: `\`${diskInt} MB\``, inline: true },

            { name: "⚙️ CPU", value: `\`${cpuInt}%\``, inline: true },

            { name: "🔁 Backups", value: "`Manual`", inline: true }

          )

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({ text: `Prefix: v! | Okami.buzz | Vortex Host` });

        await message.reply({ embeds: [embed] });

      } else {

        message.reply("❌ Failed to create server. Check your panel or provided data.");

      }

    } catch (err) {

      console.error(err);

      message.reply("🚫 Error: Unable to connect to the panel or invalid API key.");

    }

  },

};