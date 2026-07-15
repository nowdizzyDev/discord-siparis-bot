const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags
} = require('discord.js');
const { tumStoklar, getAyar } = require('../database');
const e = require('../emoji.json');

async function menuGuncelle(client) {
  const kanalId = getAyar('menu_kanal_id');
  const mesajId = getAyar('menu_mesaj_id');
  if (!kanalId || !mesajId) return;

  try {
    const kanal = await client.channels.fetch(kanalId).catch(() => null);
    if (!kanal) return;
    const mesaj = await kanal.messages.fetch(mesajId).catch(() => null);
    if (!mesaj) return;

    const stoklar = tumStoklar().filter(s => s.adet > 0);

    if (stoklar.length === 0) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.sepet} Sipariş Menüsü`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.hata} **Şu an stokta ürün bulunmuyor.**\nYeni ürünler eklenince burası otomatik güncellenir.`));
      await mesaj.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
      return;
    }

    const urunMetni = stoklar.map(s =>
      `${e.paket} **${s.urun_adi}** — \`${s.fiyat}₺\`  ${e.stok} **${s.adet}** adet` +
      (s.aciklama ? `\n-# ${s.aciklama}` : '')
    ).join('\n');

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.sepet} Sipariş Menüsü`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`> Almak istediğin ürünü seç, sana özel sipariş kanalı açılacak.`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(urunMetni))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('menu_urun_sec')
            .setPlaceholder(`${e.sepet} Bir ürün seç...`)
            .addOptions(stoklar.map(s =>
              new StringSelectMenuOptionBuilder()
                .setLabel(s.urun_adi)
                .setDescription(`${s.fiyat}₺ — Stok: ${s.adet}` + (s.aciklama ? ` | ${s.aciklama}`.slice(0, 50) : ''))
                .setValue(String(s.id))
                .setEmoji('📦')
            ))
        )
      );

    await mesaj.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.error('[menuGuncelle]', err.message);
  }
}

module.exports = { menuGuncelle };
