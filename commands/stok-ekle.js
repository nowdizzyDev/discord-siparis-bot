const {
  SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, TextDisplayBuilder,
  SeparatorBuilder, SeparatorSpacingSize
} = require('discord.js');
const { stokEkle, tumStoklar } = require('../database');
const { menuGuncelle }         = require('../handlers/menuGuncelle');
const { ownerKontrol }         = require('../handlers/ownerCheck');
const e = require('../emoji.json');

module.exports = {
  data: new SlashCommandBuilder().setName('stok-ekle').setDescription('Stoğa yeni ürün ekle'),
  async execute(interaction) {
    if (!await ownerKontrol(interaction)) return;
    const stoklar   = tumStoklar();
    const stokMetni = stoklar.length > 0
      ? stoklar.map(s => `${e.paket} \`#${s.id}\` **${s.urun_adi}** — ${s.fiyat}₺ × **${s.adet}** adet` + (s.aciklama ? `\n-# ${s.aciklama}` : '')).join('\n')
      : `_Henüz stok eklenmemiş._`;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.paket} Stok Yönetimi`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.liste} **Mevcut Stok:**\n${stokMetni}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Yeni ürün eklemek için aşağıdaki butona tıkla.`))
      .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('stok_ekle_modal_ac').setLabel('Yeni Ürün Ekle').setEmoji(e.yeni).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('stok_ekle_kapat').setLabel('Kapat').setEmoji(e.iptal).setStyle(ButtonStyle.Secondary)
      ));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
};

async function stokEkleButonIsle(interaction) {
  if (interaction.customId === 'stok_ekle_modal_ac') {
    return interaction.showModal(
      new ModalBuilder().setCustomId('stok_ekle_modal').setTitle(`${e.paket} Yeni Ürün Ekle`)
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urun_adi').setLabel('Ürün Adı').setStyle(TextInputStyle.Short).setPlaceholder('örn: Discord Nitro 1 Aylık').setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urun_fiyat').setLabel('Fiyat (₺)').setStyle(TextInputStyle.Short).setPlaceholder('örn: 49.99').setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urun_adet').setLabel('Adet').setStyle(TextInputStyle.Short).setPlaceholder('örn: 10').setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urun_aciklama').setLabel('Açıklama (opsiyonel)').setStyle(TextInputStyle.Short).setPlaceholder('Kısa ürün açıklaması').setRequired(false))
        )
    );
  }

  if (interaction.customId === 'stok_ekle_kapat') {
    return interaction.update({
      components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.basarili} Menü kapatıldı.`))],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }
}

async function stokEkleModalIsle(interaction) {
  const urunAdi  = interaction.fields.getTextInputValue('urun_adi').trim();
  const fiyat    = parseFloat(interaction.fields.getTextInputValue('urun_fiyat').trim().replace(',', '.'));
  const adet     = parseInt(interaction.fields.getTextInputValue('urun_adet').trim());
  const aciklama = interaction.fields.getTextInputValue('urun_aciklama')?.trim() || '';

  if (isNaN(fiyat) || fiyat < 0) return interaction.reply({ content: `${e.hata} Geçersiz fiyat.`, flags: MessageFlags.Ephemeral });
  if (isNaN(adet) || adet < 1)   return interaction.reply({ content: `${e.hata} Geçersiz adet.`, flags: MessageFlags.Ephemeral });

  stokEkle(urunAdi, fiyat, adet, aciklama);
  await menuGuncelle(interaction.client);

  const stoklar   = tumStoklar();
  const stokMetni = stoklar.map(s => `${e.paket} \`#${s.id}\` **${s.urun_adi}** — ${s.fiyat}₺ × **${s.adet}** adet` + (s.aciklama ? `\n-# ${s.aciklama}` : '')).join('\n');

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.basarili} Ürün Eklendi!`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([`${e.paket} **Ürün:** ${urunAdi}`, `${e.para} **Fiyat:** ${fiyat}₺`, `${e.stok} **Adet:** ${adet}`, aciklama ? `${e.not} **Açıklama:** ${aciklama}` : ''].filter(Boolean).join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.liste} **Güncel Stok:**\n${stokMetni}`))
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('stok_ekle_modal_ac').setLabel('Bir Tane Daha Ekle').setEmoji(e.yeni).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('stok_ekle_kapat').setLabel('Kapat').setEmoji(e.iptal).setStyle(ButtonStyle.Secondary)
    ));

  await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
}

module.exports.stokEkleButonIsle = stokEkleButonIsle;
module.exports.stokEkleModalIsle = stokEkleModalIsle;
