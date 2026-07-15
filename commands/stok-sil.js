const {
  SlashCommandBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder, ComponentType
} = require('discord.js');
const { tumStoklar, stokSil, stokGetir } = require('../database');
const { menuGuncelle }                   = require('../handlers/menuGuncelle');
const { ownerKontrol }                   = require('../handlers/ownerCheck');
const e = require('../emoji.json');

module.exports = {
  data: new SlashCommandBuilder().setName('stok-sil').setDescription('Stoktan ürün kaldır'),
  async execute(interaction) {
    if (!await ownerKontrol(interaction)) return;
    const stoklar = tumStoklar();

    if (stoklar.length === 0) return interaction.reply({ content: `${e.hata} Stokta hiç ürün yok.`, flags: MessageFlags.Ephemeral });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('stok_sil_sec')
      .setPlaceholder(`${e.paket} Silinecek ürünü seç...`)
      .addOptions(stoklar.map(s =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${s.urun_adi} (${s.adet} adet)`)
          .setDescription(`${s.fiyat}₺${s.aciklama ? ' — ' + s.aciklama : ''}`)
          .setValue(String(s.id))
          .setEmoji('📦')
      ));

    const reply = await interaction.reply({ content: `${e.iptal} Silmek istediğin ürünü seç:`, components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30_000, max: 1 });

    collector.on('collect', async (sel) => {
      const urunId = parseInt(sel.values[0]);
      const urun   = stokGetir(urunId);
      if (!urun) return sel.update({ content: `${e.hata} Ürün bulunamadı.`, components: [] });

      stokSil(urunId);
      await menuGuncelle(sel.client);

      const kalanlar = tumStoklar();
      const kalanListesi = kalanlar.length > 0
        ? kalanlar.map(s => `\`${s.id}\` ${e.paket} **${s.urun_adi}** — ${e.para} ${s.fiyat}₺ × ${s.adet}`).join('\n')
        : '_(stok boş)_';

      await sel.update({ content: [`${e.basarili} **${urun.urun_adi}** stoktan silindi.`, ``, `${e.liste} **Kalan Stok:**`, kalanListesi].join('\n'), components: [] });
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') interaction.editReply({ content: `${e.sure} Süre doldu.`, components: [] }).catch(() => {});
    });
  }
};
