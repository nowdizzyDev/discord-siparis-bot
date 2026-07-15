const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const fs   = require('fs');
const path = require('path');

const commands     = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`[+] ${command.data.name}`);
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`\n🔄 ${commands.length} komut kaydediliyor...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('✅ Komutlar başarıyla kaydedildi!');
  } catch (err) {
    console.error('❌ Hata:', err);
  }
})();
