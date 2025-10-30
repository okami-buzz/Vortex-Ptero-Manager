const fs = require("fs");

const path = require("path");

module.exports = (client) => {

  client.handleCommands = async (commandFolders, basePath) => {

    for (const folder of commandFolders) {

      const folderPath = path.join(basePath, folder);

      const commandFiles = fs

        .readdirSync(folderPath)

        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {

        const commandPath = path.join(folderPath, file);

        const command = require(commandPath);

        if (command.name && command.executePrefix) {

          client.commands.set(command.name, command);

          console.log(`✅ Loaded prefix command: ${command.name}`);

        } else {

          console.log(`⚠️ Skipped ${file}: missing name or executePrefix`);

        }

      }

    }

    console.log("🎯 All prefix commands successfully loaded!");

  };

};
