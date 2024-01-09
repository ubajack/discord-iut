const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction) {
		// interaction.user est l'objet représentant l'utilisateur ayant exécuté la commande
		// interaction.member est l'objet membre de guilde, représentant l'utilisateur dans la guilde en question
		await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
	},
};