import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

dotenv.config();

export default {

  data: new SlashCommandBuilder()

    .setName("userslist")

    .setDescription("👥 List all users with their server count"),

  async execute(interaction) {

    await interaction.deferReply();

    // Clear old intervals

    if (!interaction.client.userListIntervals)

      interaction.client.userListIntervals = [];

    interaction.client.userListIntervals.forEach(i => clearInterval(i));

    interaction.client.userListIntervals = [];

    const sendUserList = async () => {

      try {

        const start = Date.now();

        // Fetch all panel users

        const usersRes = await fetch(

          `${process.env.PTERO_URL}/api/application/users`,

          {

            headers: {

              "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

              "Accept": "Application/vnd.pterodactyl.v1+json",

            },

          }

        );

        const usersJson = await usersRes.json();

        const users = usersJson.data || [];

        // Fetch all servers

        const serverRes = await fetch(

          `${process.env.PTERO_URL}/api/application/servers`,

          {

            headers: {

              "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,

              "Accept": "Application/vnd.pterodactyl.v1+json",

            },

          }

        );

        const serverJson = await serverRes.json();

        const servers = serverJson.data || [];

        // Map users → server count

        const result = users.map((u) => {

          const a = u.attributes;

          const owned = servers.filter(s => s.attributes.user === a.id).length;

          return `👤 **${a.username}** (ID: ${a.id})

📧 Email: \`${a.email}\`

🖥️ Servers: **${owned}**`;

        });

        const embed = new EmbedBuilder()

          .setColor("Blue")

          .setAuthor({ name: "👥 VORTEX DEPLOY — Users List" })

          .addFields(

            {

              name: "📦 Total Users",

              value: `\`${users.length}\``,

              inline: true

            },

            {

              name: "🖥️ Total Servers",

              value: `\`${servers.length}\``,

              inline: true

            }

          )

          .addFields({

            name: "👤 Users",

            value: result.join("\n\n").slice(0, 4000)

          })

          .setFooter({ text: "Made By Okami | Vortex Deploy 👑" })

          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

      } catch (err) {

        await interaction.editReply({

          embeds: [

            new EmbedBuilder()

              .setColor("Red")

              .setDescription(`❌ Error: ${err.message}`)

              .setFooter({ text: "Made By Okami | Vortex Deploy 👑" })

          ]

        });

      }

    };

    // Run once

    await sendUserList();

    // Auto refresh every 15 sec

    const i = setInterval(sendUserList, 15000);

    interaction.client.userListIntervals.push(i);

  },

};