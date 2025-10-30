const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "help",

  description: "Shows interactive help menu with categories.",

  async executePrefix(message, args, client) {

    const mainEmbed = new EmbedBuilder()

      .setTitle(`${process.env.Name || "Vortex Host"} — Help Menu 💡`)

      .setDescription("Use the dropdown below to explore different command categories.")

      .setThumbnail(process.env.Icon)

      .setColor(0x11cbcb)

      .setFooter({ text: `Prefix: v! | Made by Okami.buzz | Vortex Host` })

      .setTimestamp();

    const menu = new StringSelectMenuBuilder()

      .setCustomId("help-menu")

      .setPlaceholder("📂 Select a Category")

      .addOptions([

        {

          label: "💡 General Commands",

          description: "Basic user-related commands",

          value: "general",

        },

        {

          label: "⚙️ Admin Commands",

          description: "Management & staff commands",

          value: "admin",

        },

        {

          label: "🧰 Server Management",

          description: "Server, node & monitoring commands",

          value: "server",

        },

      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const sent = await message.reply({ embeds: [mainEmbed], components: [row] });

    const collector = sent.createMessageComponentCollector({

      componentType: ComponentType.StringSelect,

      time: 120000, // 2 minutes

    });

    collector.on("collect", async (interaction) => {

      if (interaction.user.id !== message.author.id)

        return interaction.reply({

          content: "❌ Only the command user can interact with this menu.",

          ephemeral: true,

        });

      let embed;

      // 💡 GENERAL COMMANDS

      if (interaction.values[0] === "general") {

        embed = new EmbedBuilder()

          .setTitle("💡 General Commands")

          .setColor(0x11cbcb)

          .setDescription("Here are all the general user commands:")

          .addFields(

            {

              name: "`v!help`",

              value: "Displays this interactive help menu.",

            },

            {

              name: "`v!userinfo [UserID]`",

              value: "Check resource details of a user.\nExample: `v!userinfo` or `v!userinfo 123456789`",

            },

            {

              name: "`v!myaccount`",

              value: "Shows your linked panel account & details.",

            },

            {

              name: "`v!servercontrol`",

              value: "Start, Stop, or Restart your own server using dropdown menu (only linked servers).",

            }

          )

          .setFooter({ text: "Category: General" })

          .setTimestamp();

      }

      // ⚙️ ADMIN COMMANDS

      else if (interaction.values[0] === "admin") {

        embed = new EmbedBuilder()

          .setTitle("⚙️ Admin Commands")

          .setColor(0x11cbcb)

          .setDescription("For staff use only — manage users, resources, and linking:")

          .addFields(

            {

              name: "`v!addcoins <UserID> <Coins>`",

              value: "Add coins to a user.\nExample: `v!addcoins 123456789 50`",

            },

            {

              name: "`v!createcoupon <RAM> <DISK> <CPU> <SERVERS> <COINS> [CODE]`",

              value: "Create a custom coupon.\nExample: `v!createcoupon 2048 10000 100 1 50`",

            },

            {

              name: "`v!deletecoupon <CODE>`",

              value: "Delete a coupon.\nExample: `v!deletecoupon VRTX50`",

            },

            {

              name: "`v!setresources <UserID> <RAM> <DISK> <CPU> <SERVERS>`",

              value: "Modify user resources.\nExample: `v!setresources 123456789 4096 25000 200 3`",

            },

            {

              name: "`v!setplan <UserID> <PACKAGE>`",

              value: "Assign or change a user plan.\nExample: `v!setplan 123456789 premium`",

            },

            {

              name: "`v!createuser <Email> <Username> <Password>`",

              value: "Create a new hosting account.\nExample: `v!createuser test@vortexhost.buzz Abinash123 StrongPass`",

            },

            {

              name: "`v!removeaccount <UserID>`",

              value: "Remove a hosting account.\nExample: `v!removeaccount 123456789`",

            },

            {

              name: "`v!linkaccount <DiscordID> <PanelEmail>`",

              value: "Link a panel account with a Discord user (Admin only).",

            },

            {

              name: "`v!unlink <DiscordID>`",

              value: "Unlink a Discord user & transfer server ownership back to Admin securely.",

            },

            {

              name: "`v!restart`",

              value: "Restart the bot safely (Admin only).",

            }

          )

          .setFooter({ text: "Category: Admin" })

          .setTimestamp();

      }

      // 🧰 SERVER MANAGEMENT COMMANDS

      else if (interaction.values[0] === "server") {

        embed = new EmbedBuilder()

          .setTitle("🧰 Server Management Commands")

          .setColor(0x11cbcb)

          .setDescription("Commands to manage servers, nodes, and system status:")

          .addFields(

            {

              name: "`v!createserver <Email> <RAM> <DISK> <CPU> <Software> <Name>`",

              value:

                "Create a new Minecraft server.\nExample: `v!createserver test@vortexhost.buzz 2048 10000 100 paper MyServer`",

            },

            {

              name: "`v!deleteserver <Email or ID>`",

              value: "Delete a server.\nExample: `v!deleteserver test@vortexhost.buzz`",

            },

            {

              name: "`v!serverlist`",

              value: "View all servers and their statuses directly from the panel.",

            },

            {

              name: "`v!softwarelist`",

              value:

                "📦 View all available server softwares fetched from the panel.\n(Admin only) — Dropdown view with details.",

            },

            {

              name: "`v!panelstatus start|stop|force [minutes]`",

              value:

                "Monitor panel & node uptime live.\nExample: `v!panelstatus start 5` → Auto updates every 5 mins.",

            },

            {

              name: "`v!status`",

              value:

                "📊 View detailed Bot + Panel + Node Status with auto-refresh every 3 minutes.\nIncludes uptime, ping, and system health overview.",

            }

          )

          .setFooter({ text: "Category: Server Management" })

          .setTimestamp();

      }

      await interaction.update({ embeds: [embed], components: [row] });

    });

    collector.on("end", async () => {

      await sent.edit({ components: [] }).catch(() => {});

    });

  },

};
