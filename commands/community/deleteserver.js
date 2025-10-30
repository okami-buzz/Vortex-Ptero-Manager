const axios = require("axios");

const {

  EmbedBuilder,

  ActionRowBuilder,

  StringSelectMenuBuilder,

  ButtonBuilder,

  ButtonStyle,

  ComponentType,

} = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "deleteserver",

  description: "Delete an existing Minecraft server (Admin only)",

  async executePrefix(message, args, client) {

    // 🔒 Check for admin role

    const isAdmin = message.member.roles.cache.has(process.env.Admin_ROLE_ID);

    if (!isAdmin)

      return message.reply("🚫 You don't have permission to use this command!");

    // ⚙️ Validate input

    if (args.length < 1)

      return message.reply("⚠️ Usage: `v!deleteserver <panel email>`");

    const email = args[0];

    try {

      // 🧩 Fetch user's servers

      const serverRes = await axios.get(`${process.env.Dash_URL}/api/userservers/${email}`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const servers = serverRes.data.data || [];

      if (servers.length === 0)

        return message.reply("📭 No servers found for this email.");

      // 🧰 If multiple servers — show dropdown

      if (servers.length > 1) {

        const menu = new StringSelectMenuBuilder()

          .setCustomId("delete-server-select")

          .setPlaceholder("🗑️ Select a server to delete")

          .addOptions(

            servers.map((s) => ({

              label: s.attributes.name.slice(0, 90),

              description: `Server ID: ${s.attributes.id}`,

              value: s.attributes.id.toString(),

            }))

          );

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Delete Server`)

          .setDescription(

            `Select which server from **${email}** you want to delete.\n\n⚠️ This action is **irreversible**, so choose carefully.`

          )

          .setColor(0xff3333)

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Prefix: v! | Okami.buzz | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          });

        const sent = await message.reply({ embeds: [embed], components: [row] });

        const collector = sent.createMessageComponentCollector({

          componentType: ComponentType.StringSelect,

          time: 30000,

        });

        collector.on("collect", async (interaction) => {

          if (interaction.user.id !== message.author.id)

            return interaction.reply({

              content: "⚠️ Only the admin who used the command can select.",

              ephemeral: true,

            });

          const selectedServerId = interaction.values[0];

          // Ask confirmation

          const confirmRow = new ActionRowBuilder().addComponents(

            new ButtonBuilder()

              .setCustomId("confirm-delete")

              .setLabel("✅ Confirm Deletion")

              .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()

              .setCustomId("cancel-delete")

              .setLabel("❌ Cancel")

              .setStyle(ButtonStyle.Secondary)

          );

          const confirmEmbed = new EmbedBuilder()

            .setTitle("⚠️ Confirm Deletion")

            .setDescription(

              `Are you sure you want to **permanently delete** server ID \`${selectedServerId}\`?\n\nThis cannot be undone.`

            )

            .setColor(0xff0000)

            .setThumbnail(process.env.Icon);

          await interaction.update({ embeds: [confirmEmbed], components: [confirmRow] });

          const buttonCollector = sent.createMessageComponentCollector({

            componentType: ComponentType.Button,

            time: 20000,

          });

          buttonCollector.on("collect", async (btnInt) => {

            if (btnInt.user.id !== message.author.id)

              return btnInt.reply({

                content: "⚠️ Only the admin who used the command can confirm this.",

                ephemeral: true,

              });

            if (btnInt.customId === "cancel-delete") {

              await btnInt.update({

                embeds: [

                  new EmbedBuilder()

                    .setTitle("❌ Deletion Cancelled")

                    .setDescription("No changes were made.")

                    .setColor(0xaaaaaa),

                ],

                components: [],

              });

              return;

            }

            // Confirm deletion

            if (btnInt.customId === "confirm-delete") {

              try {

                await axios.post(

                  `${process.env.Dash_URL}/api/deleteserver`,

                  { id: selectedServerId },

                  { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

                );

                const doneEmbed = new EmbedBuilder()

                  .setTitle("✅ Server Deleted Successfully")

                  .setDescription(

                    `🗑️ Server with ID \`${selectedServerId}\` owned by **${email}** has been deleted successfully.`

                  )

                  .setColor(0x00ff73)

                  .setThumbnail(process.env.Icon)

                  .setFooter({

                    text: `Action by ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

                  });

                await btnInt.update({ embeds: [doneEmbed], components: [] });

              } catch (error) {

                console.error("❌ Deletion Error:", error);

                await btnInt.update({

                  embeds: [

                    new EmbedBuilder()

                      .setTitle("❌ Deletion Failed")

                      .setDescription("Could not delete the server. Check API or permissions.")

                      .setColor(0xff0000),

                  ],

                  components: [],

                });

              }

            }

          });

        });

        collector.on("end", async () => {

          await sent.edit({ components: [] }).catch(() => {});

        });

      } else {

        // If only one server exists

        const serverId = servers[0].attributes.id;

        await axios.post(

          `${process.env.Dash_URL}/api/deleteserver`,

          { id: serverId },

          { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

        );

        const embed = new EmbedBuilder()

          .setTitle(`${process.env.Name} — Server Deleted`)

          .setColor(0xff3333)

          .setDescription(`🗑️ Successfully deleted server ID \`${serverId}\` for **${email}**.`)

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Prefix: v! | Okami.buzz | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          })

          .setTimestamp();

        await message.reply({ embeds: [embed] });

      }

    } catch (error) {

      console.error("❌ API Error:", error);

      message.reply("🚫 Error connecting to the panel. Please check your API credentials or Dash_URL.");

    }

  },

};