// ======================================================
// 🎨 VORTEX DEPLOY - EMBED SYSTEM
// ⚡ Made by Okami | Asia/Kolkata
// ======================================================

import { EmbedBuilder } from "discord.js";
import moment from "moment-timezone";

// 📦 Configurable Constants
const FOOTER = process.env.FOOTER_TEXT || "⚡ Made by Okami | Vortex Deploy 👑";
const TIMEZONE = process.env.TIMEZONE || "Asia/Kolkata";

// 🕒 Utility Function: Get Local Time
function localTime() {
  return moment().tz(TIMEZONE).format("DD MMM YYYY | hh:mm A");
}

// 🎯 Embed Factory Functions
export const createSuccess = (title, description) => {
  return new EmbedBuilder()
    .setColor("#00FF88")
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setFooter({ text: `${FOOTER} • ${localTime()}` })
    .setTimestamp();
};

export const createError = (title, description) => {
  return new EmbedBuilder()
    .setColor("#FF0040")
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter({ text: `${FOOTER} • ${localTime()}` })
    .setTimestamp();
};

export const createInfo = (title, description) => {
  return new EmbedBuilder()
    .setColor("#00BFFF")
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setFooter({ text: `${FOOTER} • ${localTime()}` })
    .setTimestamp();
};

export const createWarning = (title, description) => {
  return new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setFooter({ text: `${FOOTER} • ${localTime()}` })
    .setTimestamp();
};

// 🧩 Custom Advanced Embed (for Panels, Nodes, Status, etc.)
export const createPanelEmbed = (title, fields = [], color = "#5865F2") => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🖥️ ${title}`)
    .addFields(fields)
    .setFooter({ text: `${FOOTER} • ${localTime()}` })
    .setTimestamp();
  return embed;
};

// ======================================================
// ✅ Example Usage:
// import { createSuccess } from "../embeds/index.js";
// await interaction.reply({ embeds: [createSuccess("Server Created", "Your server has been successfully deployed!")] });
// ======================================================
