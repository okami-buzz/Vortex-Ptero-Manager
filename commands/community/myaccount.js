const { EmbedBuilder } = require("discord.js");

const fs = require("fs");

require("dotenv").config();

module.exports = {

  name: "myaccount",

  description: "View your linked panel account details.",

  async executePrefix(message, args, client) {

    // ✅ Load links file

    const filePath = "./data/user_links.json";

    if (!fs.existsSync(filePath)) {

      return message.reply("⚠️ No linked account data found on the system.");

    }

    const userLinks = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const userData = userLinks[message.author.id];

    // ❌ If user not linked

    if (!userData) {

      const notLinked = new EmbedBuilder()

        .setTitle(`${process.env.Name || "Vortex Host"} — Account Not Linked ❌`)

        .setColor(0xff4444)

        .setThumbnail(process.env.Icon)

        .setDescription(

          "You don’t have a linked panel account yet.\nAsk a staff member to link it using the `v!linkaccount` command."

        )

        .setFooter({ text: "Prefix: v! | Contact Staff Team for linking assistance." })

        .setTimestamp();

      return message.reply({ embeds: [notLinked] });

    }

    // ✅ User linked — show detailed info

    const embed = new EmbedBuilder()

      .setTitle(`${process.env.Name || "Vortex Host"} — Linked Account Details 🔗`)

      .setColor(0x11cbcb)

      .setThumbnail(process.env.Icon)

      .setDescription("Your Discord account is successfully linked with our panel system.")

      .addFields(

        { name: "👤 Discord User", value: `<@${message.author.id}> (\`${message.author.tag}\`)`, inline: false },

        { name: "📧 Panel Email", value: `\`${userData.email}\``, inline: false },

        { name: "🆔 Panel ID", value: `\`${userData.panel_id}\``, inline: true },

        { name: "🔗 Linked By", value: `${userData.linked_by}`, inline: true },

        { name: "📅 Linked At", value: `<t:${Math.floor(new Date(userData.linked_at).getTime() / 1000)}:F>`, inline: false }

      )

      .setFooter({ text: `Prefix: v! | Vortex Host | Made by Okami.buzz` })

      .setTimestamp();

    await message.reply({ embeds: [embed] });

  },

};
