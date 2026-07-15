const {
  SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder, ContainerBuilder, TextDisplayBuilder,
  SeparatorBuilder, SeparatorSpacingSize, ComponentType
} = require('discord.js');
const { setAyar, getAyar, odemeEkle, odemeSil, odemeYontemleri } = require('../database');
const { ownerKontrol } = require('../handlers/ownerCheck');
const e = require('../emoji.json');

function setupContainer() {
  const logKanal = getAyar('log_kanal_id');
  const kategori = getAyar('kategori_id');
  const yetkili  = getAyar('yetkili_rol_id');
  const odemeler = odemeYontemleri();
  const ikonlar  = { paypal: e.paypal, paycell: e.paycell, papara: e.papara, iban: e.iban };
  const isimler  = { paypal: 'PayPal', paycell: 'Paycell', papara: 'Papara', iban: 'IBAN' };

  const odemeListesi = odemeler.length > 0
    ? odemeler.map(o => `${ikonlar[o.yontem] || e.odeme} **${isimler[o.yontem] || o.yontem}**: \`${o.bilgi}\``).join('\n')
    : `-# Henüz ödeme yöntemi eklenmedi`;

  return new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.ayar} Bot Ayarları`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `${e.logkanal} **Log Kanalı:** ${logKanal ? `<#${logKanal}>` : `${e.hata} Ayarlanmamış`}`,
      `${e.kategori} **Ticket Kategorisi:** ${kategori ? `<#${kategori}>` : `${e.hata} Ayarlanmamış`}`,
      `${e.kalkan} **Yetkili Rolü:** ${yetkili ? `<@&${yetkili}>` : `${e.hata} Ayarlanmamış`}`
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${e.odeme} **Ödeme Yöntemleri:**\n${odemeListesi}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Ayarlanmış olanlar ${e.basarili} yeşil gösterilir.`))
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup_logkanal').setLabel('Log Kanalı').setEmoji(e.logkanal).setStyle(logKanal ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_kategori').setLabel('Ticket Kategorisi').setEmoji(e.kategori).setStyle(kategori ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_yetkili').setLabel('Yetkili Rolü').setEmoji(e.kalkan).setStyle(yetkili ? ButtonStyle.Success : ButtonStyle.Secondary)
    ))
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup_odeme_ekle').setLabel('Ödeme Ekle').setEmoji(e.odeme).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setup_odeme_sil').setLabel('Ödeme Sil').setEmoji(e.iptal).setStyle(odemeler.length > 0 ? ButtonStyle.Danger : ButtonStyle.Secondary).setDisabled(odemeler.length === 0)
    ));
}

module.exports = {
  data: new SlashCommandBuilder().setName('setup').setDescription('Bot ayarlarını yapılandır'),
  async execute(interaction) {
    if (!await ownerKontrol(interaction)) return;
    await interaction.reply({ components: [setupContainer()], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
};

async function setupGuncelle(interaction) {
  await interaction.editReply({ components: [setupContainer()], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => {});
}

async function setupButonIsle(interaction) {
  const { customId, guild } = interaction;

  if (customId === 'setup_logkanal') {
    return interaction.showModal(new ModalBuilder().setCustomId('setup_modal_logkanal').setTitle('Log Kanalı Ayarla')
      .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('deger').setLabel('Log Kanalı ID').setStyle(TextInputStyle.Short).setPlaceholder('Sağ tık → ID Kopyala').setValue(getAyar('log_kanal_id') || '').setRequired(true))));
  }

  if (customId === 'setup_kategori') {
    return interaction.showModal(new ModalBuilder().setCustomId('setup_modal_kategori').setTitle('Ticket Kategorisi Ayarla')
      .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('deger').setLabel('Kategori ID').setStyle(TextInputStyle.Short).setPlaceholder('Kategorinin ID\'sini gir').setValue(getAyar('kategori_id') || '').setRequired(true))));
  }

  if (customId === 'setup_yetkili') {
    return interaction.showModal(new ModalBuilder().setCustomId('setup_modal_yetkili').setTitle('Yetkili Rolü Ayarla')
      .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('deger').setLabel('Yetkili Rol ID').setStyle(TextInputStyle.Short).setPlaceholder('Sağ tık → ID Kopyala').setValue(getAyar('yetkili_rol_id') || '').setRequired(true))));
  }

  if (customId === 'setup_odeme_ekle') {
    const secimContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.odeme} Ödeme Yöntemi Ekle\n-# Hangi yöntemi eklemek istiyorsun?`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('setup_odeme_ekle_sec').setPlaceholder(`${e.odeme} Ödeme yöntemi seç...`).addOptions(
          new StringSelectMenuOptionBuilder().setLabel('PayPal').setValue('paypal').setEmoji(e.paypal),
          new StringSelectMenuOptionBuilder().setLabel('Paycell').setValue('paycell').setEmoji(e.paycell),
          new StringSelectMenuOptionBuilder().setLabel('Papara').setValue('papara').setEmoji(e.papara),
          new StringSelectMenuOptionBuilder().setLabel('IBAN').setValue('iban').setEmoji(e.iban)
        )
      ));

    await interaction.update({ components: [secimContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: i => i.user.id === interaction.user.id && i.customId === 'setup_odeme_ekle_sec',
      time: 30_000, max: 1
    });

    collector.on('collect', async (sel) => {
      const yontem = sel.values[0];
      const isimler = { paypal: 'PayPal', paycell: 'Paycell', papara: 'Papara', iban: 'IBAN' };
      await sel.showModal(new ModalBuilder().setCustomId(`setup_modal_odeme_${yontem}`).setTitle(`${isimler[yontem]} Bilgisi`)
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('deger').setLabel(`${isimler[yontem]} hesap bilgisi`).setStyle(TextInputStyle.Short).setPlaceholder('Hesap no / e-posta / IBAN').setRequired(true))));
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') await interaction.editReply({ components: [setupContainer()], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => {});
    });
    return;
  }

  if (customId === 'setup_odeme_sil') {
    const odemeler = odemeYontemleri();
    if (odemeler.length === 0) return;
    const ikonlar = { paypal: e.paypal, paycell: e.paycell, papara: e.papara, iban: e.iban };
    const isimler = { paypal: 'PayPal', paycell: 'Paycell', papara: 'Papara', iban: 'IBAN' };

    const silContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${e.iptal} Ödeme Yöntemi Sil\n-# Hangi yöntemi kaldırmak istiyorsun?`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('setup_odeme_sil_sec').setPlaceholder(`${e.iptal} Kaldırılacak yöntemi seç...`)
          .addOptions(odemeler.map(o => new StringSelectMenuOptionBuilder().setLabel(isimler[o.yontem] || o.yontem).setDescription(o.bilgi).setValue(o.yontem).setEmoji(ikonlar[o.yontem] || e.odeme)))
      ));

    await interaction.update({ components: [silContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: i => i.user.id === interaction.user.id && i.customId === 'setup_odeme_sil_sec',
      time: 30_000, max: 1
    });

    collector.on('collect', async (sel) => {
      odemeSil(sel.values[0]);
      await sel.update({ components: [setupContainer()], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') await interaction.editReply({ components: [setupContainer()], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => {});
    });
    return;
  }
}

async function setupModalIsle(interaction) {
  const { customId, guild } = interaction;
  const deger = interaction.fields.getTextInputValue('deger').trim();

  if (customId === 'setup_modal_logkanal') {
    const kanal = guild.channels.cache.get(deger);
    if (!kanal) return interaction.reply({ content: `${e.hata} Kanal bulunamadı.`, flags: MessageFlags.Ephemeral });
    setAyar('log_kanal_id', deger);
    await interaction.reply({ content: `${e.basarili} Log kanalı <#${deger}> ayarlandı.`, flags: MessageFlags.Ephemeral });
    await setupGuncelle(interaction);
    return;
  }

  if (customId === 'setup_modal_kategori') {
    const kanal = guild.channels.cache.get(deger);
    if (!kanal) return interaction.reply({ content: `${e.hata} Kategori bulunamadı.`, flags: MessageFlags.Ephemeral });
    setAyar('kategori_id', deger);
    await interaction.reply({ content: `${e.basarili} Ticket kategorisi **${kanal.name}** ayarlandı.`, flags: MessageFlags.Ephemeral });
    await setupGuncelle(interaction);
    return;
  }

  if (customId === 'setup_modal_yetkili') {
    const rol = guild.roles.cache.get(deger);
    if (!rol) return interaction.reply({ content: `${e.hata} Rol bulunamadı.`, flags: MessageFlags.Ephemeral });
    setAyar('yetkili_rol_id', deger);
    await interaction.reply({ content: `${e.basarili} Yetkili rolü <@&${deger}> ayarlandı.`, flags: MessageFlags.Ephemeral });
    await setupGuncelle(interaction);
    return;
  }

  if (customId.startsWith('setup_modal_odeme_')) {
    const yontem  = customId.replace('setup_modal_odeme_', '');
    const isimler = { paypal: 'PayPal', paycell: 'Paycell', papara: 'Papara', iban: 'IBAN' };
    const ikonlar = { paypal: e.paypal, paycell: e.paycell, papara: e.papara, iban: e.iban };
    odemeEkle(yontem, deger);
    await interaction.reply({ content: `${e.basarili} **${isimler[yontem]}** eklendi. ${ikonlar[yontem]} \`${deger}\``, flags: MessageFlags.Ephemeral });
    await setupGuncelle(interaction);
    return;
  }
}

module.exports.setupButonIsle = setupButonIsle;
module.exports.setupModalIsle = setupModalIsle;
