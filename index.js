const { token } = require('./config.json');
const { Client, GatewayIntentBits, Partials, Collection, Events, MessageFlags } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { ticketButonIsle }                      = require('./handlers/ticketPanel');
const { setupButonIsle, setupModalIsle }        = require('./commands/setup');
const { menuSelectIsle, menuAdetModalIsle }     = require('./commands/menu');
const { stokEkleButonIsle, stokEkleModalIsle } = require('./commands/stok-ekle');
const { stokGuncelleModalIsle }                = require('./commands/stok-guncelle');
const e = require('./emoji.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`${e.basarili} Komut yüklendi: /${command.data.name}`);
  }
}

client.once(Events.ClientReady, (c) => {
  console.log(`\n${e.basarili} Bot hazır: ${c.user.tag}`);
  console.log(`${e.zil} ${client.guilds.cache.size} sunucuda aktif\n`);
  c.user.setActivity(`${e.sepet} /menu ile sipariş ver`);
});

async function hataReply(interaction, mesaj) {
  const payload = { content: mesaj, flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
  else await interaction.reply(payload).catch(() => {});
}

client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: `${e.hata} Bilinmeyen komut.`, flags: MessageFlags.Ephemeral });
    try { await command.execute(interaction); }
    catch (err) { console.error(`[HATA] /${interaction.commandName}:`, err); await hataReply(interaction, `${e.hata} Bir hata oluştu.`); }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'menu_urun_sec') {
      try { await menuSelectIsle(interaction); }
      catch (err) { console.error('[HATA] Menu select:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('setup_')) {
      try { await setupButonIsle(interaction); }
      catch (err) { console.error('[HATA] Setup buton:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
    if (interaction.customId.startsWith('stok_ekle_')) {
      try { await stokEkleButonIsle(interaction); }
      catch (err) { console.error('[HATA] Stok ekle buton:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
    const ticketButonlar = ['ticket_yetkili_cagir', 'ticket_odeme_bilgisi', 'ticket_siparis_detay', 'ticket_onayla', 'ticket_iptal'];
    if (ticketButonlar.includes(interaction.customId)) {
      try { await ticketButonIsle(interaction); }
      catch (err) { console.error('[HATA] Ticket buton:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('menu_adet_modal_')) {
      try { await menuAdetModalIsle(interaction); }
      catch (err) { console.error('[HATA] Menu adet modal:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
    if (interaction.customId.startsWith('setup_modal_')) {
      try { await setupModalIsle(interaction); }
      catch (err) { console.error('[HATA] Setup modal:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
    if (interaction.customId === 'stok_ekle_modal') {
      try { await stokEkleModalIsle(interaction); }
      catch (err) { console.error('[HATA] Stok ekle modal:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
    if (interaction.customId.startsWith('stok_guncelle_modal_')) {
      try { await stokGuncelleModalIsle(interaction); }
      catch (err) { console.error('[HATA] Stok güncelle modal:', err); await hataReply(interaction, `${e.hata} Hata oluştu.`); }
      return;
    }
  }
});

process.on('unhandledRejection', (err) => console.error('[UnhandledRejection]', err));
process.on('uncaughtException',  (err) => console.error('[UncaughtException]', err));

client.login(token);
