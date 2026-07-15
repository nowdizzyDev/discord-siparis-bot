const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionsBitField,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize
} = require('discord.js');
const { sipariisKaydet, stokDus, kanalSiparisi, siparisDurumGuncelle, getAyar, odemeYontemleri } = require('../database');
const { logGonder }    = require('./logHandler');
const { menuGuncelle } = require('./menuGuncelle');
const e = require('../emoji.json');

async function ticketPanelGonder(kanal, user, urun, adet = 1) {
  const toplamFiyat = (urun.fiyat * adet).toFixed(2);
  sipariisKaydet(kanal.id, user.id, urun.id, urun.urun_adi, adet, parseFloat(toplamFiyat));

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_yetkili_cagir').setLabel('Yetkili Çağır').setEmoji(e.zil).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_odeme_bilgisi').setLabel('Ödeme Bilgileri').setEmoji(e.odeme).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_siparis_detay').setLabel('Sipariş Detayı').setEmoji(e.detay).setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_onayla').setLabel('Siparişi Onayla').setEmoji(e.onayla).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_iptal').setLabel('Siparişi İptal Et').setEmoji(e.iptal).setStyle(ButtonStyle.Danger)
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.ticket} Sipariş Kanalı`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `${e.kullanici} **Müşteri:** <@${user.id}>`,
      `${e.paket} **Ürün:** ${urun.urun_adi}`,
      `${e.stok} **Adet:** ${adet}`,
      `${e.para} **Birim Fiyat:** ${urun.fiyat}₺`,
      `${e.para} **Toplam:** ${toplamFiyat}₺`,
      urun.aciklama ? `${e.not} **Açıklama:** ${urun.aciklama}` : ''
    ].filter(Boolean).join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `-# ${e.zil} **Yetkili Çağır** — Yetkiliye bildirim gönderir`,
      `-# ${e.odeme} **Ödeme Bilgileri** — Aktif ödeme yöntemlerini gösterir`,
      `-# ${e.detay} **Sipariş Detayı** — Sipariş özetini gösterir`,
      `-# ${e.onayla} **Onayla** — Siparişi tamamlar, stok düşer *(sadece yetkili)*`,
      `-# ${e.iptal} **İptal** — Kanalı kapatır`
    ].join('\n')))
    .addActionRowComponents(row1)
    .addActionRowComponents(row2);

  await kanal.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function ticketButonIsle(interaction) {
  const { customId, channel, user, guild } = interaction;

  if (customId === 'ticket_yetkili_cagir') {
    const yetkiliRolId = getAyar('yetkili_rol_id');
    if (!yetkiliRolId) {
      return interaction.reply({ content: `${e.hata} Yetkili rolü ayarlanmamış.`, flags: MessageFlags.Ephemeral });
    }
    return interaction.reply({ content: `<@&${yetkiliRolId}> ${e.zil} **${user.username}** sipariş için yardım istiyor!` });
  }

  if (customId === 'ticket_odeme_bilgisi') {
    const odemeler = odemeYontemleri();
    if (odemeler.length === 0) {
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.hata} Henüz ödeme yöntemi eklenmemiş.\nYetkili \`/setup\` ile ekleyebilir.`))],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
    const ikonlar = { paypal: e.paypal, paycell: e.paycell, papara: e.papara, iban: e.iban };
    const isimler = { paypal: 'PayPal', paycell: 'Paycell', papara: 'Papara', iban: 'IBAN' };
    const odemeMetni = odemeler.map(o => `**${ikonlar[o.yontem] || e.odeme} ${isimler[o.yontem] || o.yontem.toUpperCase()}**\n\`\`\`${o.bilgi}\`\`\``).join('\n');
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.odeme} Ödeme Yöntemleri`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(odemeMetni))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Ödeme sonrası ekran görüntüsünü bu kanala at, yetkili onaylayacak.`));
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }

  if (customId === 'ticket_siparis_detay') {
    const siparis = kanalSiparisi(channel.id);
    if (!siparis) return interaction.reply({ content: `${e.hata} Aktif sipariş bulunamadı.`, flags: MessageFlags.Ephemeral });
    const durumIkon = { acik: `${e.sari} Bekliyor`, tamamlandi: `${e.yesil} Tamamlandı`, iptal: `${e.kirmizi} İptal` };
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.liste} Sipariş Detayı`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `${e.id} **Sipariş No:** \`#${siparis.id}\``,
        `${e.kullanici} **Müşteri:** <@${siparis.kullanici_id}>`,
        `${e.paket} **Ürün:** ${siparis.urun_adi}`,
        `${e.para} **Toplam:** ${siparis.toplam_fiyat}₺`,
        `${e.takvim} **Tarih:** ${siparis.tarih}`,
        `${e.durum} **Durum:** ${durumIkon[siparis.durum] || siparis.durum}`
      ].join('\n')));
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }

  if (customId === 'ticket_onayla') {
    const yetkiliRolId = getAyar('yetkili_rol_id');
    const member = await guild.members.fetch(user.id);
    const yetkiliMi = yetkiliRolId
      ? member.roles.cache.has(yetkiliRolId)
      : member.permissions.has(PermissionsBitField.Flags.Administrator);
    if (!yetkiliMi) return interaction.reply({ content: `${e.hata} Bu butonu sadece yetkililer kullanabilir.`, flags: MessageFlags.Ephemeral });

    const siparis = kanalSiparisi(channel.id);
    if (!siparis) return interaction.reply({ content: `${e.hata} Aktif sipariş bulunamadı.`, flags: MessageFlags.Ephemeral });

    const stokSonuc = stokDus(siparis.urun_id, siparis.adet);
    if (stokSonuc.changes === 0) return interaction.reply({ content: `${e.hata} Yeterli stok yok!`, flags: MessageFlags.Ephemeral });

    siparisDurumGuncelle(channel.id, 'tamamlandi');
    await logGonder(guild, { type: 'tamamlandi', siparis, yetkili: user });
    await menuGuncelle(guild.client);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.basarili} Sipariş Tamamlandı!`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `${e.paket} **${siparis.urun_adi}** siparişi onaylandı.`,
        `${e.para} Tutar: **${siparis.toplam_fiyat}₺**`,
        `${e.kullanici} Müşteri: <@${siparis.kullanici_id}>`,
        `${e.kalkan} Onaylayan: <@${user.id}>`,
        ``,
        `-# Kanal 10 saniye içinde kapatılacak...`
      ].join('\n')));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    setTimeout(() => channel.delete('Sipariş tamamlandı').catch(() => {}), 10_000);
    return;
  }

  if (customId === 'ticket_iptal') {
    const siparis = kanalSiparisi(channel.id);
    if (siparis) {
      siparisDurumGuncelle(channel.id, 'iptal');
      await logGonder(guild, { type: 'iptal', siparis, iptalEden: user });
      await menuGuncelle(guild.client);
    }
    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `## ${e.iptal} Sipariş İptal Edildi`,
        ``,
        `${e.kullanici} İptal eden: <@${user.id}>`,
        `-# Kanal 5 saniye içinde kapatılacak...`
      ].join('\n')));
    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    setTimeout(() => channel.delete('Sipariş iptal edildi').catch(() => {}), 5_000);
    return;
  }
}

module.exports = { ticketPanelGonder, ticketButonIsle };
