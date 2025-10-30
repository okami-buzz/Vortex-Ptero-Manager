const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "softwarelist",

  description: "View all available server softwares (Admin only).",

  async executePrefix(message, args, client) {

    // 🧱 Admin-only check

    const adminRole = message.member.roles.cache.has(`${process.env.Admin_ROLE_ID}`);

    if (!adminRole) {

      return message.reply("🚫 You don’t have permission to use this command.");

    }

    try {

      // 🛰️ Fetch egg (software) list from panel

      const res = await axios.get(`${process.env.Dash_URL}/api/application/nests/1/eggs?include=nest`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const eggs = res.data.data;

      if (!eggs || eggs.length === 0)

        return message.reply("⚠️ No software (eggs) found on your panel.");

      // 📋 Create dropdown menu of available software

      const options = eggs.map((egg) => ({

        label: egg.attributes.name,

        description: egg.attributes.description?.substring(0, 90) || "No description available.",

        value: egg.attributes.id.toString(),

      }));

      const menu = new StringSelectMenuBuilder()

        .setCustomId("select-software")

        .setPlaceholder("🧩 Select a Software to view details")

        .addOptions(options.slice(0, 25)); // Discord max 25 options

      const row = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()

        .setTitle(`${process.env.Name || "Vortex Host"} — Software List 🧩`)

        .setDescription("Select a software from the dropdown below to view its details.")

        .setColor(0x11cbcb)

        .setThumbnail(process.env.Icon)

        .setFooter({ text: "Admin Only | Vortex Host" })

        .setTimestamp();

      const sent = await message.reply({ embeds: [embed], components: [row] });

      // 🎯 Handle selection

      const collector = sent.createMessageComponentCollector({

        componentType: ComponentType.StringSelect,

        time: 120000, // 2 mins

      });

      collector.on("collect", async (interaction) => {

        if (interaction.user.id !== message.author.id)

          return interaction.reply({

            content: "❌ You can’t use this selection.",

            ephemeral: true,

          });

        const selectedId = interaction.values[0];

        const selectedEgg = eggs.find((egg) => egg.attributes.id.toString() === selectedId);

        if (!selectedEgg)

          return interaction.reply({ content: "❌ Software not found.", ephemeral: true });

        const detailsEmbed = new EmbedBuilder()

          .setTitle(`🧰 ${selectedEgg.attributes.name}`)

          .setColor(0x11cbcb)

          .setDescription(

            `${selectedEgg.attributes.description || "No description provided."}\n\n` +

            `**Docker Image:** *(Hidden for Security)*\n` +

            `**Startup Command:** *(Hidden for Security)*\n\n` +

            `🧩 **Egg ID:** ${selectedEgg.attributes.id}\n` +

            `📦 **Nest:** ${selectedEgg.attributes.nest}\n` +

            `💻 **Author:** ${selectedEgg.attributes.author || "Unknown"}`

          )

          .setThumbnail(process.env.Icon)

          .setFooter({ text: "Admin Only | Vortex Host" })

          .setTimestamp();

        await interaction.update({ embeds: [detailsEmbed], components: [row] });

      });

      collector.on("end", async () => {

        await sent.edit({ components: [] }).catch(() => {});

      });

    } catch (error) {

      console.error("❌ Error fetching software list:", error);

      const errEmbed = new EmbedBuilder()

        .setTitle("Error Fetching Software ❌")

        .setDescription("Could not connect to the panel or invalid API key.")

        .setColor(0xff4444)

        .setTimestamp();

      message.reply({ embeds: [errEmbed] }).catch(() => {});

    }

  },

};