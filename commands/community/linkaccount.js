const { EmbedBuilder } = require("discord.js");

const fs = require("fs");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "linkaccount",

  description: "Link a Discord user to their panel account using only their email (Admin Only)",

  async executePrefix(message, args, client) {

    // 🧩 Admin Check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole)

      return message.reply("🚫 You don't have permission to use this command!");

    // 🧾 Args Check

    const userMention = message.mentions.users.first();

    const email = args[1];

    if (!userMention || !email) {

      return message.reply(

        "⚠️ Usage: `v!linkaccount <@User> <Panel Email>`\nExample: `v!linkaccount @Abinash test@vortexhost.buzz`"

      );

    }

    // 📡 Fetch Panel ID Automatically

    let panelId;

    try {

      const response = await axios.get(`${process.env.Dash_URL}/api/users`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const users = response.data.data || [];

      const matchedUser = users.find(

        (u) => u.attributes.email.toLowerCase() === email.toLowerCase()

      );

      if (!matchedUser)

        return message.reply("❌ No user found with this email on the panel.");

      panelId = matchedUser.attributes.id;

    } catch (error) {

      console.error("⚠️ Error fetching panel users:", error);

      return message.reply("🚫 Failed to connect to panel API. Check DASH_API or Dash_URL.");

    }

    // 💾 Ensure data directory

    if (!fs.existsSync("./data")) fs.mkdirSync("./data");

    const filePath = "./data/user_links.json";

    // 📘 Load existing data

    let userLinks = {};

    if (fs.existsSync(filePath)) {

      userLinks = JSON.parse(fs.readFileSync(filePath, "utf8"));

    }

    // 📝 Save link

    userLinks[userMention.id] = {

      discord_tag: userMention.tag,

      email: email,

      panel_id: panelId,

      linked_by: message.author.tag,

      linked_at: new Date().toISOString(),

    };

    fs.writeFileSync(filePath, JSON.stringify(userLinks, null, 2));

    // 🎨 Professional Confirmation Embed

    const embed = new EmbedBuilder()

      .setTitle(`${process.env.Name || "Vortex Host"} — Account Linked 🔗`)

      .setColor(0x11cbcb)

      .setThumbnail(process.env.Icon)

      .setDescription(

        `✅ Successfully linked **${userMention}** to their panel account.\nAll future server commands will now use this link automatically.`

      )

      .addFields(

        { name: "👤 Discord User", value: `<@${userMention.id}> (\`${userMention.tag}\`)`, inline: false },

        { name: "📧 Panel Email", value: `\`${email}\``, inline: false },

        { name: "🆔 Panel ID", value: `\`${panelId}\``, inline: false },

        { name: "🔗 Linked By", value: `${message.author}`, inline: true },

        { name: "📅 Linked At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }

      )

      .setFooter({

        text: `Prefix: v! | Vortex Host | Made by Okami.buzz`,

      })

      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // 📩 DM confirmation to user

    try {

      await userMention.send(

        `🔗 Your Discord account has been successfully linked with your Vortex Host panel account (**${email}**).`

      );

    } catch {

      console.log("⚠️ Unable to DM the linked user.");

    }

  },

};
