const DiscordMessages = require('../discordTools/discordMessages.js');
const Keywords = require('../util/keywords.js');

module.exports = async (client, interaction) => {
    const instance = client.readInstanceFile(interaction.guildId);
    const guildId = interaction.guildId;

    if (interaction.customId.startsWith('SmartSwitchEdit')) {
        let id = interaction.customId.replace('SmartSwitchEditId', '');
        let smartSwitchName = interaction.fields.getTextInputValue('SmartSwitchName');
        let smartSwitchCommand = interaction.fields.getTextInputValue('SmartSwitchCommand');

        if (smartSwitchName !== instance.switches[id].name) {
            instance.switches[id].name = smartSwitchName;
        }

        if (smartSwitchCommand !== instance.switches[id].command) {
            const rustplus = client.rustplusInstances[guildId];
            if (!rustplus || (rustplus && !rustplus.ready)) {
                client.log('WARNING', 'Not currently connected to a rust server.');
            }
            else if (Keywords.getListOfUsedKeywords(client, guildId, rustplus.serverId).includes(smartSwitchCommand)) {
                rustplus.log('WARNING', `The command '${smartSwitchCommand}' is already in use.`);
            }
            else {
                instance.switches[id].command = smartSwitchCommand;
            }
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartSwitchMessage(guildId, id);
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEdit', ''));
        let smartAlarmName = interaction.fields.getTextInputValue('SmartAlarmName');
        let smartAlarmMessage = interaction.fields.getTextInputValue('SmartAlarmMessage');

        let changed = false;
        if (smartAlarmName !== instance.serverList[ids.serverId].alarms[ids.entityId].name) {
            instance.serverList[ids.serverId].alarms[ids.entityId].name = smartAlarmName;
            changed = true;
        }
        if (smartAlarmMessage !== instance.serverList[ids.serverId].alarms[ids.entityId].message) {
            instance.serverList[ids.serverId].alarms[ids.entityId].message = smartAlarmMessage;
            changed = true;
        }
        client.writeInstanceFile(guildId, instance);

        if (changed) {
            await DiscordMessages.sendSmartAlarmMessage(interaction.guildId, ids.serverId, ids.entityId);
        }
    }

    interaction.deferUpdate();
}