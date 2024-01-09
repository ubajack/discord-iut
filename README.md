# BeepBoop

## Liens utiles

- [Portail développeur](https://discord.com/developers/applications)
- [Documentation discord.js](https://discord.js.org/docs/packages/discord.js/14.14.1)
- [Guide discord.js](https://discordjs.guide/#before-you-begin)

## Préparation de l'application

- Créer une application en vous rendant au lien suivant : https://discord.com/developers/applications
- Créer un serveur Discord
- Sur votre PC : 
    - créer un dossier du nom du bot
    - Se déplacer dans ce dossier
- Exemple avec un bot nommé BeepBoop : 
```bash
mkdir BeepBoop
cd BeepBoop/
```
- Initialiser le projet
```bash
npm init -y
```
- Installer les packages 
```bash
npm install dotenv discord.js
```
- Activer le mode développeur
```
User Settings > Advanced > Developer Mode
```
- A la racine du projet, créer un fichier `.env` contenant les variables suivantes : 
```
TOKEN=...
CLIENT_ID=...
GUILD_ID=...
```
- Vous pouvez trouver les valeurs de ces variables de la façon suivante : 
    - TOKEN 
    ```
    Developer Portal > Application > [App] > Bot > Reset Token
    ```
    - CLIENT_ID
    ```
    Developer Portal > Application > [App] > General Information > Application ID
    ```
    - GUILD_ID
    ```
    Clic droit sur le nom du serveur Discord > Copy Server ID
    ```

## Première connexion

- A la racine du projet, créer un fichier `index.js`
```js
require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');

// Création d'une instance du client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Bout de code exécuté une fois que le client est prêt
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Connexion à Discord avec le token
client.login(process.env.TOKEN);
```
- Testez votre code en tapant la commande suivante : 
```bash
node index.js
```
```bash
Ready! Logged in as BeepBoup#0142
```

## Les slash commands

- A la racine du projet, créez les dossiers `commands/utility` 
- Créez votre première slash command dans le fichier `commands/utility/ping.js`
```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
    // Fonction exécutée à l'appel de la commande
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
```
A la racine du projet, créez le fichier `deploy-commands.js` comme suit :
```js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Récupération de tous les dossiers de commandes
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Récupération de tous les fichiers de commandes
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    // Récupération des données de chaque commande au format JSON
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construction et préparation d'une instance du module REST
const rest = new REST().setToken(process.env.TOKEN);

// Déploiement des commandes
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // La méthode put est utilisée pour actualiser toutes les commandes dans la guilde avec le set de commandes actuel
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
```
- A chaque fois que vous créez de nouvelles commandes, exécuter ce code de sorte à synchronyser les commandes avec l'application enregistrée sur Discord
- De retour dans le fichier index.js, modifiez-le de sorte à ce que les slash commands soient prises en charge
```js
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

// Création d'une instance du client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
        // Création d'un nouvel item dans la collection avec pour clé le nom de la commande et pour valeur le module exporté
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Bout de code exécuté une fois que le client est prêt
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Ecoute sur l'utilisation de slash commands
client.on(Events.InteractionCreate, async interaction => {
    // Vérification si l'interaction est bien une slash command
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
        // Exécution de la commande
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Connexion à Discord avec le token
client.login(process.env.TOKEN);
```
- Créez une commande `server` en créant le fichier `commands/utility/server.js` : 
```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild est l'objet représentant la guilde dans laquelle la commande a été éxécutée
		await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};
```
- Créez une commande `user` en créant le fichier `commands/utility/user.js` : 
```js
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
```
- Exécutez le fichier `deploy-commands.js`
- Testez les commandes

## Gestion des évènements

- A la racine du projet, créez un dossier `events`, dans lequel vous y créerez un fichier par évènement à prendre en charge
- Créez le fichier `events/ready.js` : 
```js
const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
```
- Créez le fichier `events/interactionCreate.js` : 
```js
const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};
```
- Revenez au fichier `index.js` et modifiez-le comme suit : 
```js
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Création d'une instance du client
const client = new Client({ intents: [GatewayIntentBits.Guilds]});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Récupération des commandes
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
        // Création d'un nouvel item dans la collection avec pour clé le nom de la commande et pour valeur le module exporté
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// Récupération des évènements
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Connexion à Discord avec le token
client.login(process.env.TOKEN);
```

## Commandes avancées

- Créons une commande `echo` :
    - Créez le fichier `commands/utility/echo.js`
    ```js
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
    ```
    - Exécutez le fichier `deploy-commands.js`
    - Testez la commande

## Création du repo git

- Sur Github, créer un nouveau répertoire privé
- Ajoutez `ubajack` en tant que collaborateur
- A la racine du projet, créez un fichier `.gitignore` de la sorte :
```
.env
node_modules
```
- Suivez les instructions sur Github pour votre premier commit et votre premier push vers le répertoire distant

## Déploiement

- Récupérez l'adresse ip de votre instance OVH de même que la clé ssh vous permettant de vous y connecter
- Connectez-vous à l'instance
- Créez une clé SSH
```bash
ssh-keygen
```
- Copiez la clé créée
```bash
cat ~/.ssh/id_rsa.pub
```
- Ajoutez-là à votre compte Github (Settings > SSH and GPG keys > New SSH key)
- Clonez votre répertoire via l'adresse SSH
- Déplacez-vous dans ce répertoire
- Installez `npm` et `nodejs`
```bash
sudo apt install nodejs npm
```
- Installez pm2
```bash
sudo npm install pm2@latest -g
```
- Créez un fichier .env 
```bash
nano .env
```
- Copiez et collez le contenu de votre fichier .env dans votre projet (CTRL+MAJ+V)
```
TOKEN=...
CLIENT_ID=...
GUILD_ID=...
```
- Tapez `CTRL+X` suivi de `y` puis `ENTREE` pour sauvegarder
- Exécutez votre application
```bash
pm2 start index.js
```
- Testez votre bot sur votre serveur