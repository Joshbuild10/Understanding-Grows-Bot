const cron = require('cron');
const { channelId, guildId } = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const csv = require('csv-parser');

module.exports = {
    sendStrLen: function(client)
    {
        
        // Specifing your guild (server) and your channel
        const guild = client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);

        let scheduledMessage = new cron.CronJob('00 * * * * *', () => {
            // This runs every day at 00:00:00

            // Create an array to store rows
            let rows = [];

            // Create a readable stream from csv file
            fs.createReadStream('data/strlen_exercises.csv')
            .pipe(csv())
            .on('data', (row) => { rows.push(row); })
            .on('end', () => {

                // Choose a random muscle
                let muscle = rows[Math.floor(Math.random() * rows.length)]['Muscle'];
            
                // Reads the history.json file if exists, else stores an empty json object
                let history = fs.existsSync('data/history.json') ? JSON.parse(fs.readFileSync('data/history.json')) : new Object();
                // Creates the days array if it doesn't exist
                history.days = history.days || [];
                
                let curDay = 1;

                // Gets the name of the last day
                if (fs.existsSync('data/history.json')) { curDay = history.days.at(-1)['day'] + 1; }

                // Print or return value
                channel.send(`Day ${curDay}\n${muscle}`);
                //console.log(muscle);

                // Add the new day to the history
                history.days.push({'day': curDay, 'muscle': muscle, 'date': Date.now()});
                fs.writeFileSync('data/history.json', JSON.stringify(history));
            });});
            // Start the cron job
            scheduledMessage.start()
    },
    data: new Discord.SlashCommandBuilder()
		.setName('what')
		.setDescription('Provides information about the current strengthen and lengthen muscle.'),
	async execute(interaction) 
    {
        // Loads the history.json file if exists
        let history = fs.existsSync('data/history.json') ? JSON.parse(fs.readFileSync('data/history.json')) : new Object();
        // Gets information about the current day
        let curDay = history.days.at(-1);
        // Checks that the date is the same, approximately
        if (Date.now() - curDay['date'] > 86400000) 
        {
            // Send a message to the user that information is not available
            await interaction.reply(`No strengthen and lengthen muscle has occured today, please wait until tomorrow.`);
            return;
        }
        // Find the muscle in the csv file
        let rows = [];
        fs.createReadStream('data/strlen_exercises.csv')
        .pipe(csv())
        .on('data', (row) => { rows.push(row); })
        .on('end', async () => {
            // Find the muscle in the csv file
            let muscle = rows.find(row => row['Muscle'] === curDay['muscle']);
            // Send the muscle information to the user if found
            if (muscle) 
            { 
                replyMessage = `Today's strengthen and length muscle is: ${muscle['Muscle']}`
                    + `\nIt seems you want to know more about this muscle, or what exercises you can do to strengthen or lengthen it.`
                    + `\nMuscle description: ${muscle['Definition']}`
                    + `\nExercises that work this muscle: ${muscle['Examples']}`
                await interaction.reply(replyMessage);

                // Create an embed to send to the user
                const embed = new Discord.EmbedBuilder()
                    .setColor('#f47900')
                    .setTitle(`Today's muscle is: ${ muscle['Muscle'] }`)
                    .setDescription(`Description: ${ muscle['Definition'] }\n`)
                    .addFields(
                        { name: 'Exercises that work this muscle', value: muscle['Examples'] + '\n'},
                    )
                    .setTimestamp()
                    .setFooter({'text': 'UnderstandingGrows'});

                // Send the embed to the user
                await interaction.channel.send({ embeds: [embed] });
            }
            // Send a message to the user that information is not available
            else { await interaction.reply(`No information about the current strengthen and lengthen muscle is available.`); }
        });
	}
};