const {

  EmbedBuilder,

  ActionRowBuilder,

  StringSelectMenuBuilder,

  ComponentType,

} = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "servercontrol",

  description: "Control your linked server — start, stop, or restart.",

  async executePrefix(message, args, client) {

    const action = args[0]?.toLowerCase();

    const validActions = ["start", "stop", "restart"];

    // ⚠️ Validate command usage

    if (!action || !validActions.includes(action)) {

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setTitle("⚙️ Server Control — Usage")

            .setColor(0xffcc00)

            .setDescription(

              `Use this command to control your servers.\n\n**Usage:** \`v!servercontrol <start|stop|restart>\`\nExample: \`v!servercontrol restart\``

            )

            .setFooter({ text: "Vortex Host | Powered by Okami.buzz" }),

        ],

      });

    }

    try {

      // 🔹 Check link between Discord ID & panel account

      const linkRes = await axios.get(`${process.env.Dash_URL}/api/linkinfo/${message.author.id}`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      if (!linkRes.data || !linkRes.data.email) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setTitle("🔗 Not Linked")

              .setColor(0xff4444)

              .setDescription(

                "You haven't linked your Discord account to any panel account.\nPlease contact Vortex Host Staff Team."

              ),

          ],

        });

      }

      const userEmail = linkRes.data.email;

      // 🔹 Fetch user's servers from panel

      const serverRes = await axios.get(`${process.env.Dash_URL}/api/userservers/${userEmail}`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const servers = serverRes.data.data || [];

      if (servers.length === 0)

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setTitle("📭 No Servers Found")

              .setColor(0xff4444)

              .setDescription("You don’t have any active servers linked to your account."),

          ],

        });

      // 🧩 If multiple servers — use dropdown

      if (servers.length > 1) {

        const menu = new StringSelectMenuBuilder()

          .setCustomId("server-select")

          .setPlaceholder("🧩 Select your server to control")

          .addOptions(

            servers.map((s) => ({

              label: s.attributes.name.slice(0, 90),

              description: `Server ID: ${s.attributes.id}`,

              value: s.attributes.id.toString(),

            }))

          );

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new EmbedBuilder()

          .setTitle("⚡ Control Your Server")

          .setDescription(

            `Select one of your servers below to **${action.toUpperCase()}**.\n> Action will be executed immediately after selection.`

          )

          .setColor(0x11cbcb)

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `User: ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          });

        const sent = await message.reply({ embeds: [embed], components: [row] });

        const collector = sent.createMessageComponentCollector({

          componentType: ComponentType.StringSelect,

          time: 30000,

        });

        collector.on("collect", async (interaction) => {

          if (interaction.user.id !== message.author.id)

            return interaction.reply({

              content: "⚠️ You can only control your own servers.",

              ephemeral: true,

            });

          const serverId = interaction.values[0];

          await interaction.deferUpdate();

          // ⚙️ Execute action

          await axios.post(

            `${process.env.Dash_URL}/api/client/servers/${serverId}/power`,

            { signal: action },

            { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

          );

          const success = new EmbedBuilder()

            .setTitle("✅ Server Action Executed")

            .setColor(0x00ff73)

            .setDescription(

              `⚡ **Action:** ${action.toUpperCase()}\n🖥️ **Server:** ${servers.find((s) => s.attributes.id.toString() === serverId).attributes.name

              }\n👤 **Owner:** ${userEmail}`

            )

            .setThumbnail(process.env.Icon)

            .setFooter({

              text: `Executed by ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

            });

          await sent.edit({ embeds: [success], components: [] });

        });

        collector.on("end", async () => {

          await sent.edit({ components: [] }).catch(() => {});

        });

      } else {

        // 🚀 Single server

        const serverId = servers[0].attributes.id;

        await axios.post(

          `${process.env.Dash_URL}/api/client/servers/${serverId}/power`,

          { signal: action },

          { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

        );

        const embed = new EmbedBuilder()

          .setTitle("✅ Server Action Executed")

          .setColor(0x00ff73)

          .setDescription(

            `⚡ **Action:** ${action.toUpperCase()}\n🖥️ **Server:** ${servers[0].attributes.name}\n👤 **Owner:** ${userEmail}`

          )

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Executed by ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          });

        await message.reply({ embeds: [embed] });

      }

    } catch (err) {

      console.error("❌ Server Control Error:", err);

      await message.reply({

        embeds: [

          new EmbedBuilder()

            .setTitle("❌ Action Failed")

            .setColor(0xff0000)

            .setDescription(

              "Unable to control the server. Please ensure your account is linked and the panel is reachable."

            )

            .setFooter({

              text: "Vortex Host | Powered by Okami.buzz",

            }),

        ],

      });

    }

  },

};
