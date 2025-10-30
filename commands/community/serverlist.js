const axios = require("axios");

const { EmbedBuilder } = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "serverlist",

  description: "Show all servers from your panel grouped by nodes (Admin only)",

  async executePrefix(message, args, client) {

    // 🔐 Check Admin Role

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) return message.reply("🚫 You don’t have permission to use this command!");

    try {

      // 📡 Fetch servers from panel API

      const res = await axios.get(`${process.env.Dash_URL}/api/application/servers`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const servers = res.data.data || [];

      if (!servers.length) return message.reply("📭 No servers found on your panel!");

      // 🧩 Group servers by node

      const grouped = {};

      for (const srv of servers) {

        const s = srv.attributes;

        const node = s.node || "Unknown Node";

        if (!grouped[node]) grouped[node] = [];

        grouped[node].push(s);

      }

      const nodeNames = Object.keys(grouped);

      const chunkSize = 2; // 2 nodes per page for readability

      const pages = [];

      for (let i = 0; i < nodeNames.length; i += chunkSize) {

        pages.push(nodeNames.slice(i, i + chunkSize));

      }

      let page = 0;

      // 📖 Create embed per page

      const createEmbed = () => {

        let desc = "";

        for (const node of pages[page]) {

          desc += `**🖥️ Node:** \`${node}\`\n`;

          grouped[node].forEach((s) => {

            const statusEmoji = s.suspended

              ? "⚫"

              : s.limits.cpu === 0

              ? "🔴"

              : "🟢";

            desc += `${statusEmoji} **${s.name}** | Owner: \`${s.user}\`\n`;

            desc += `💾 RAM: ${s.limits.memory}MB | Disk: ${s.limits.disk}MB | CPU: ${s.limits.cpu}%\n`;

            desc += `🧩 Egg: \`${s.egg}\`\n\n`;

          });

          desc += "━━━━━━━━━━━━━━━━━━━━━━━\n";

        }

        return new EmbedBuilder()

          .setTitle(`${process.env.Name} — Node-wise Server List`)

          .setColor(0x00bfff)

          .setThumbnail(process.env.Icon)

          .setDescription(desc.length > 4000 ? desc.slice(0, 4000) + "..." : desc)

          .setFooter({

            text: `Page ${page + 1}/${pages.length} • Total Servers: ${servers.length} | Prefix: v! | Okami.buzz | Vortex Host`,

          })

          .setTimestamp();

      };

      // 📨 Send first page

      const embedMessage = await message.reply({ embeds: [createEmbed()] });

      // ⏪ Pagination controls

      if (pages.length > 1) {

        await embedMessage.react("⬅️");

        await embedMessage.react("➡️");

        const filter = (reaction, user) =>

          ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === message.author.id;

        const collector = embedMessage.createReactionCollector({ filter, time: 60000 });

        collector.on("collect", async (reaction) => {

          if (reaction.emoji.name === "⬅️") page = page > 0 ? page - 1 : pages.length - 1;

          else if (reaction.emoji.name === "➡️") page = (page + 1) % pages.length;

          await embedMessage.edit({ embeds: [createEmbed()] });

          await reaction.users.remove(message.author.id);

        });

        collector.on("end", () => {

          embedMessage.reactions.removeAll().catch(() => {});

        });

      }

    } catch (err) {

      console.error("⚠️ API Error:", err);

      message.reply("🚫 Failed to fetch server list. Check your API key or panel URL.");

    }

  },

};