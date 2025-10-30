const {

  EmbedBuilder,

  ActionRowBuilder,

  StringSelectMenuBuilder,

  ComponentType

} = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "unlink",

  description: "Admin command — Unlink a Discord user and transfer their server ownership to admin.",

  async executePrefix(message, args, client) {

    // 🛑 Check admin role

    const isAdmin = message.member.roles.cache.has(process.env.Admin_ROLE_ID);

    if (!isAdmin)

      return message.reply("🚫 You don't have permission to use this command!");

    const discordId = args[0];

    if (!discordId)

      return message.reply("⚠️ Usage: `v!unlink <DiscordUserID>`");

    try {

      // Fetch linked panel user

      const linkRes = await axios.get(`${process.env.Dash_URL}/api/linkinfo/${discordId}`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      if (!linkRes.data || !linkRes.data.email)

        return message.reply("❌ No panel account linked with this Discord user.");

      const userEmail = linkRes.data.email;

      // Fetch all servers owned by this panel user

      const serverRes = await axios.get(`${process.env.Dash_URL}/api/userservers/${userEmail}`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const servers = serverRes.data.data || [];

      if (servers.length === 0)

        return message.reply("📭 This user has no active servers on the panel.");

      // If user has multiple servers → use dropdown

      if (servers.length > 1) {

        const menu = new StringSelectMenuBuilder()

          .setCustomId("server-select")

          .setPlaceholder("🧩 Select a server to transfer ownership")

          .addOptions(

            servers.map((s) => ({

              label: s.attributes.name.slice(0, 90),

              description: `Server ID: ${s.attributes.id}`,

              value: s.attributes.id.toString(),

            }))

          );

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Ownership Transfer`)

          .setDescription(

            `Select a server below to transfer ownership from **${userEmail}** to **${process.env.ADMIN_EMAIL}**.`

          )

          .setColor(0xffa500)

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Admin: ${message.author.tag} | Prefix: v! | Okami.buzz | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          });

        const sent = await message.reply({ embeds: [embed], components: [row] });

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

          // Transfer ownership via API

          await axios.post(

            `${process.env.Dash_URL}/api/transferownership`,

            { server_id: serverId, new_owner: process.env.ADMIN_EMAIL },

            { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

          );

          const successEmbed = new EmbedBuilder()

            .setTitle(`${process.env.Name} — Ownership Transferred ✅`)

            .setColor(0x00ff73)

            .setDescription(

              `Ownership of the selected server has been successfully transferred.\n\n👤 **Old Owner:** ${userEmail}\n👑 **New Owner:** ${process.env.ADMIN_EMAIL}`

            )

            .setThumbnail(process.env.Icon)

            .setFooter({

              text: `Action by: ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

            })

            .setTimestamp();

          await sent.edit({ embeds: [successEmbed], components: [] });

          // DM user

          try {

            const user = await client.users.fetch(discordId);

            await user.send(

              `🔄 Your server ownership has been transferred to **Vortex Host Admin (${process.env.ADMIN_EMAIL})** for security purposes.`

            );

          } catch {

            console.log("⚠️ Could not DM user.");

          }

        });

        collector.on("end", async () => {

          await sent.edit({ components: [] }).catch(() => {});

        });

      } else {

        // If user has only one server

        const serverId = servers[0].attributes.id;

        await axios.post(

          `${process.env.Dash_URL}/api/transferownership`,

          { server_id: serverId, new_owner: process.env.ADMIN_EMAIL },

          { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

        );

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Ownership Transferred ✅`)

          .setColor(0x00ff73)

          .setDescription(

            `Ownership transferred successfully.\n\n👤 **Old Owner:** ${userEmail}\n👑 **New Owner:** ${process.env.ADMIN_EMAIL}`

          )

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Action by: ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          })

          .setTimestamp();

        await message.reply({ embeds: [embed] });

      }

    } catch (err) {

      console.error("❌ Unlink Error:", err);

      const errorEmbed = new EmbedBuilder()

        .setTitle("❌ Error During Ownership Transfer")

        .setColor(0xff0000)

        .setDescription("Could not unlink or transfer server. Check API or panel connection.")

        .setTimestamp();

      await message.reply({ embeds: [errorEmbed] });

    }

  },

};
