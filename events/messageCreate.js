module.exports = {

  name: "messageCreate",

  async execute(message, client) {

    const prefix = "v!"; // ✅ Change prefix here if needed

    // Ignore bots or messages without prefix

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);

    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {

      await command.executePrefix(message, args, client);

    } catch (err) {

      console.error(err);

      message.reply("⚠️ There was an error executing this command.");

    }

  },

};