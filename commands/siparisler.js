const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { acikSiparisler } = require('../database');
const { ownerKontrol }   = require('../handlers/ownerCheck');
const e = require('../emoji.json');

module.exports = {
  data: new SlashCommandBuilder().setName('siparisler').setDescription('Açık siparişleri listele'),
  async execute(interaction) {
    if (!await ownerKontrol(interaction)) return;
    const siparisler = acikSiparisler();

    if (siparisler.length === 0) return interaction.reply({ content: `${e.liste} Şu an açık sipariş yok.`, flags: MessageFlags.Ephemeral });

    const satirlar = siparisler.map(s => [
      `**#${s.id}** — ${e.paket} ${s.urun_adi}`,
      `${e.kullanici} <@${s.kullanici_id}> ${e.para} ${s.toplam_fiyat}₺ ${e.takvim} ${s.tarih}`,
      `${e.pin} Kanal: <#${s.kanal_id}>`
    ].join('\n'));

    const sayfalar = [];
    let sayfa = `## ${e.liste} Açık Siparişler (${siparisler.length} adet)\n\n`;
    for (const satir of satirlar) {
      if ((sayfa + satir + '\n\n').length > 1900) { sayfalar.push(sayfa.trimEnd()); sayfa = ''; }
      sayfa += satir + '\n\n';
    }
    if (sayfa.trim()) sayfalar.push(sayfa.trimEnd());

    await interaction.reply({ content: sayfalar[0], flags: MessageFlags.Ephemeral });
    for (let i = 1; i < sayfalar.length; i++) {
      await interaction.followUp({ content: sayfalar[i], flags: MessageFlags.Ephemeral });
    }
  }
};
