const axios = require("axios");

const {

  EmbedBuilder,

  ActionRowBuilder,

  StringSelectMenuBuilder,

  ComponentType,

} = require("discord.js");

require("dotenv").config();

module.exports = {

  name: "createserver",

  description: "Create a new Minecraft server (Admin only)",

  async executePrefix(message, args, client) {

    // 🔒 Admin check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole)

      return message.reply("🚫 You don’t have permission to use this command!");

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

      // 🌍 Fetch nodes list

      const nodesRes = await axios.get(`${process.env.Dash_URL}/api/nodes`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const nodes = nodesRes.data.data || [];

      if (!nodes.length) return message.reply("❌ No nodes found on the panel.");

      // 🧭 Dropdown for node selection

      const menu = new StringSelectMenuBuilder()

        .setCustomId("node-select")

        .setPlaceholder("🧩 Select a Node for this server")

        .addOptions(

          nodes.map((n) => ({

            label: n.attributes.name.slice(0, 90),

            description: `Node ID: ${n.attributes.id} | Location: ${n.attributes.location}`,

            value: n.attributes.id.toString(),

          }))

        );

      const row = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()

        .setTitle(`${process.env.Name} — Node Selection 🌐`)

        .setDescription(

          "Choose the node where you want to host this new server.\n\nOnce selected, creation will start automatically."

        )

        .setColor(0x11cbcb)

        .setThumbnail(process.env.Icon)

        .setFooter({

          text: `Prefix: v! | Vortex Host | Okami.buzz | ${new Date().toLocaleTimeString(

            "en-IN",

            { timeZone: "Asia/Kolkata" }

          )}`,

        })

        .setTimestamp();

      const sent = await message.reply({ embeds: [embed], components: [row] });

      // 🎛️ Collector for node selection

      const collector = sent.createMessageComponentCollector({

        componentType: ComponentType.StringSelect,

        time: 30000,

      });

      collector.on("collect", async (interaction) => {

        if (interaction.user.id !== message.author.id)

          return interaction.reply({

            content: "⚠️ Only the admin who used the command can select a node.",

            ephemeral: true,

          });

        const nodeId = interaction.values[0];

        await interaction.deferUpdate();

        // 🚀 Create server with selected node

        try {

          const response = await axios.post(

            `${process.env.Dash_URL}/api/createserver`,

            {

              email,

              ram: ramInt,

              disk: diskInt,

              cpu: cpuInt,

              software: software.toLowerCase(),

              name,

              node_id: nodeId,

              backups: "manual",

            },

            { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

          );

          const data = response.data;

          if (data.status === "success") {

            const successEmbed = new EmbedBuilder()

              .setTitle(`${process.env.Name} — Server Created ✅`)

              .setColor(0x00ff73)

              .setDescription(`✅ Successfully created a new server on your panel!`)

              .addFields(

                { name: "📧 Email", value: `\`${email}\``, inline: true },

                { name: "🧩 Name", value: `\`${name}\``, inline: true },

                { name: "🖥️ Software", value: `\`${software}\``, inline: true },

                { name: "💾 RAM", value: `\`${ramInt} MB\``, inline: true },

                { name: "📂 Disk", value: `\`${diskInt} MB\``, inline: true },

                { name: "⚙️ CPU", value: `\`${cpuInt}%\``, inline: true },

                { name: "🗄️ Node ID", value: `\`${nodeId}\``, inline: true },

                { name: "🔁 Backups", value: "`Manual`", inline: true }

              )

              .setThumbnail(process.env.Icon)

              .setFooter({

                text: `Prefix: v! | Okami.buzz | Vortex Host | ${new Date().toLocaleTimeString(

                  "en-IN",

                  { timeZone: "Asia/Kolkata" }

                )}`,

              })

              .setTimestamp();

            await sent.edit({ embeds: [successEmbed], components: [] });

          } else {

            await sent.edit({

              embeds: [

                new EmbedBuilder()

                  .setTitle("❌ Server Creation Failed")

                  .setColor(0xff0000)

                  .setDescription("The panel API returned an error — please recheck details."),

              ],

              components: [],

            });

          }

        } catch (err) {

          console.error(err);

          await sent.edit({

            embeds: [

              new EmbedBuilder()

                .setTitle("🚫 API Error")

                .setColor(0xff3333)

                .setDescription(

                  "Failed to connect to the panel. Please verify your API key or node setup."

                ),

            ],

            components: [],

          });

        }

      });

      collector.on("end", async () => {

        await sent.edit({ components: [] }).catch(() => {});

      });

    } catch (error) {

      console.error(error);

      message.reply("🚫 Could not fetch nodes or connect to panel.");

    }

  },

};
