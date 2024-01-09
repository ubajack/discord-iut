const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
	.setName('echo')
	.setDescription('Replies with your input!')
    // Ajout d'une option permettant à un utilisateur d'envoyer un message
	.addStringOption(option =>
		option.setName('input')
			.setDescription('The input to echo back'));

module.exports = {
	data,
	async execute(interaction) {
        // Récupération du message d'entrée écrit par l'utilisateur
        const input = interaction.options.getString('input');
		await interaction.reply(input);
	},
};