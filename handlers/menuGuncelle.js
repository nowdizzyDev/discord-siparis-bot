const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags
} = require('discord.js');
const { tumStoklar, getAyar } = require('../database');
const { bannerUrl } = require('../config.json');
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
        .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl)))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `## ${e.sepet} Sipariş Menüsü\n\n` +
          `${e.hata} **Şu an stokta ürün bulunmuyor.**\nYeni ürünler eklenince burası otomatik güncellenecektir.`
        ));
      await mesaj.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
      return;
    }

    const urunListesi = stoklar.map(s =>
      `${e.etiket} **${s.urun_adi}** — \`${s.fiyat}₺\` ${e.stok} **${s.adet}** adet` +
      (s.aciklama ? `\n> -# ${s.aciklama}` : '')
    ).join('\n');

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl)))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${e.sepet} Sipariş Menüsü\n\n` +
        `${e.zil} Sipariş vermeden önce aşağıdaki bilgileri okuyunuz.\n` +
        `Ürünü seçip adet girerek siparişinizi oluşturabilirsiniz.`
      ))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${e.liste} **Sipariş Kuralları:**\n` +
        `> ${e.basarili} Siparişinizi verdikten sonra kanalınızı 24 saat içinde kontrol ediniz.\n` +
        `> ${e.basarili} Ödemeyi yaptıktan sonra ekran görüntüsünü kanala atınız.\n` +
        `> ${e.basarili} Yetkililere özel mesaj atmak yerine ticket kanalını kullanınız.`
      ))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${e.paket} **Mevcut Ürünler:**\n${urunListesi}`
      ))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# ${e.sure} Siparişleriniz en kısa sürede işleme alınacaktır.`
      ))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('menu_urun_sec')
            .setPlaceholder(`${e.paket} Bir ürün seçin...`)
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
