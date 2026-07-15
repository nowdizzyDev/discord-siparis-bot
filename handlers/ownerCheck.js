const { ownerId } = require('../config.json');
const { MessageFlags } = require('discord.js');

function isOwner(userId) {
  return userId === ownerId;
}

async function ownerKontrol(interaction) {
  if (!isOwner(interaction.user.id)) {
    await interaction.reply({
      content: `🔒 Bu komut sadece bot sahibi tarafından kullanılabilir.`,
      flags: MessageFlags.Ephemeral
    });
    return false;
  }
  return true;
}

module.exports = { isOwner, ownerKontrol };
