const axios = require("axios");

const { EmbedBuilder } = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "createuser", // v!createuser

  description: "Create a new panel account (Admin only)",

  async executePrefix(message, args, client) {

    // 🔒 Admin Role Check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don’t have permission to use this command!");

    }

    // 🧾 Check arguments

    if (args.length < 3) {

      return message.reply("⚠️ Usage: `v!createuser <email> <username> <password>`");

    }

    const [email, username, password] = args;

    try {

      // 🌐 Send API Request

      const res = await axios.post(

        `${process.env.Dash_URL}/api/createuser`,

        { email, username, password },

        { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

      );

      if (res.data.status === "success") {

        const userId = res.data.id;

        // 💬 Success Embed

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Account Created`)

          .setColor(0x00ffb3)

          .setDescription(`✅ **New user account created successfully!**`)

          .addFields(

            { name: "👤 Username", value: `\`${username}\``, inline: true },

            { name: "📧 Email", value: `\`${email}\``, inline: true },

            { name: "🔑 Password", value: `\`${password}\``, inline: true },

            { name: "🆔 Panel User ID", value: `\`${userId}\``, inline: false }

          )

          .setURL(`${process.env.Dash_URL}`)

          .setThumbnail(process.env.Icon)

          .setTimestamp()

          .setFooter({ text: `Prefix: v! | Okami.buzz | Vortex Host` });

        await message.reply({ embeds: [embed] });

        // 📩 DM user credentials (optional)

        try {

          const targetUser = await client.users.fetch(message.author.id);

          await targetUser.send({

            content:

              `💼 **Hosting Account Created!**\n` +

              `> 🌐 Panel: ${process.env.Dash_URL}\n` +

              `> 👤 Username: \`${username}\`\n` +

              `> 🔑 Password: \`${password}\`\n` +

              `> 🆔 ID: ${userId}\n\n` +

              `Enjoy your hosting experience with **Vortex Host** ⚡`,

          });

        } catch {

          console.log("⚠️ Unable to DM credentials to the user.");

        }

      } else {

        message.reply("❌ Failed to create user. Check the API or inputs.");

      }

    } catch (err) {

      console.error(err);

      message.reply("🚫 Error connecting to the panel API. Verify your DASH_API or URL.");

    }

  },

};