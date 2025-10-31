const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "transferserver",

  description: "Admin only — Transfer a server's ownership to another panel user.",

  async executePrefix(message, args, client) {

    // ✅ Admin Permission Check

    const isAdmin = message.member.roles.cache.has(process.env.Admin_ROLE_ID);

    if (!isAdmin)

      return message.reply("🚫 You don't have permission to use this command!");

    // ⚙️ Usage Check

    if (args.length < 2)

      return message.reply(

        "⚠️ Usage: `v!transferserver <email or discordID> <newOwnerEmail>`\nExample: `v!transferserver test@vortexhost.buzz admin@vortexhost.buzz`"

      );

    const target = args[0]; // Can be email or Discord ID

    const newOwner = args[1];

    try {

      // 🔍 Fetch User Info by Email or Linked Discord ID

      let userEmail = target;

      if (!target.includes("@")) {

        // Try fetching linked email from JSON file

        const fs = require("fs");

        const filePath = process.env.LINKS_FILE || "./data/user_links.json";

        if (fs.existsSync(filePath)) {

          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

          const linked = data[target];

          if (linked && linked.email) userEmail = linked.email;

        }

      }

      if (!userEmail.includes("@"))

        return message.reply("❌ Could not find a valid email for that user.");

      // 🧠 Fetch all servers owned by this user

      const serverRes = await axios.get(`${process.env.Dash_URL}/api/userservers/${userEmail}`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const servers = serverRes.data.data || [];

      if (servers.length === 0)

        return message.reply("📭 This user has no active servers to transfer.");

      // ⚠️ Confirmation message

      const confirmEmbed = new EmbedBuilder()

        .setTitle(`${process.env.Name} — Ownership Transfer Confirmation`)

        .setDescription(

          `You're about to transfer **server ownership** from **${userEmail}** → **${newOwner}**.\n\n` +

          "⚠️ Once transferred, the **old owner will permanently lose all access** — including console, FTP, and API permissions.\n\n" +

          "Please select which server(s) to transfer below:"

        )

        .setColor(0xffa500)

        .setThumbnail(process.env.Icon)

        .setFooter({

          text: `Action by: ${message.author.tag} | Prefix: v! | Okami.buzz | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

        });

      // 🧩 Create dropdown menu with user's servers

      const menu = new StringSelectMenuBuilder()

        .setCustomId("transfer-select")

        .setPlaceholder("🧩 Select a server to transfer")

        .addOptions(

          servers.map((s) => ({

            label: s.attributes.name.slice(0, 90),

            description: `Server ID: ${s.attributes.id}`,

            value: s.attributes.id.toString(),

          }))

        );

      const row = new ActionRowBuilder().addComponents(menu);

      const sent = await message.reply({ embeds: [confirmEmbed], components: [row] });

      // 🎯 Collector for server selection

      const collector = sent.createMessageComponentCollector({

        componentType: ComponentType.StringSelect,

        time: 30000,

      });

      collector.on("collect", async (interaction) => {

        if (interaction.user.id !== message.author.id)

          return interaction.reply({

            content: "⚠️ Only the admin who used the command can select a server.",

            ephemeral: true,

          });

        const serverId = interaction.values[0];

        await interaction.deferUpdate();

        try {

          // 🚀 Transfer Ownership via API

          await axios.post(

            `${process.env.Dash_URL}/api/transferownership`,

            { server_id: serverId, new_owner: newOwner },

            { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

          );

          const successEmbed = new EmbedBuilder()

            .setTitle(`${process.env.Name} — Ownership Transferred ✅`)

            .setColor(0x00ff73)

            .setDescription(

              `Ownership of the selected server has been successfully transferred.\n\n👤 **Old Owner:** ${userEmail}\n👑 **New Owner:** ${newOwner}\n\n⚠️ The previous owner can no longer access this server via panel or FTP.`

            )

            .setThumbnail(process.env.Icon)

            .setFooter({

              text: `Action by: ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

            })

            .setTimestamp();

          await sent.edit({ embeds: [successEmbed], components: [] });

          // 🔔 Try DM old owner if linked

          const fs = require("fs");

          const filePath = process.env.LINKS_FILE || "./data/user_links.json";

          if (fs.existsSync(filePath)) {

            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

            for (const [discordId, link] of Object.entries(data)) {

              if (link.email === userEmail) {

                try {

                  const user = await client.users.fetch(discordId);

                  await user.send(

                    `🔄 Your server ownership has been transferred to **${newOwner}** by Vortex Host Administration. You no longer have access to this server.`

                  );

                } catch {

                  console.log("⚠️ Could not DM old owner.");

                }

              }

            }

          }

        } catch (err) {

          console.error("❌ Transfer Error:", err);

          const errorEmbed = new EmbedBuilder()

            .setTitle("❌ Transfer Failed")

            .setColor(0xff0000)

            .setDescription("Failed to transfer ownership. Please check API connection or provided email.")

            .setTimestamp();

          await sent.edit({ embeds: [errorEmbed], components: [] });

        }

      });

      collector.on("end", async () => {

        await sent.edit({ components: [] }).catch(() => {});

      });

    } catch (err) {

      console.error("❌ Transfer Command Error:", err);

      message.reply("🚫 Error occurred while fetching user servers or API connection failed.");

    }

  },

};