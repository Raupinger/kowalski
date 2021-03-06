const {roleBoundaries} = require("../../modules/globals");
const {roles} = require("../../modules/database");
const {roleFromMention} = require("../../modules/parser");

module.exports = {
    name: "role",
    description: "Add/remove roles from the database.",
    usage: "[add|remove] [role] [minReactions]",
    min_args: 3,
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        const role = roleFromMention(args[1], message.guild);
        if (role) {
            // Parse number
            const parsed = parseInt(args[2]);
            if (isNaN(parsed)) {
                throw new Error("Invalid arguments.");
            }

            switch (args[0].toLowerCase()) {
                case "add":
                    // Try to add the role to the database
                    try {
                        const created = await roles.create({
                            guild: message.guild.id,
                            reactions: parsed,
                            role: role.id
                        });
                        if (created) {
                            await message.channel.send(`The role ${role.name} was added to the database.`);
                        }
                    } catch (error) {
                        console.error("Something went wrong when trying to create the entry: ", error);
                    }
                    break;
                case "remove":
                    // Try to remove the role from the database
                    try {
                        const deleted = await roles.destroy({
                            where: {
                                guild: message.guild.id,
                                reactions: parsed,
                                role: role.id
                            }
                        });
                        if (deleted) {
                            await message.channel.send(`The role ${role.name} was removed from the database.`);
                        } else {
                            await message.channel.send(`Could not find an entry for the role ${role.name}.`);
                        }
                    } catch (error) {
                        console.error("Something went wrong when trying to delete the entry: ", error);
                    }
                    break;
                default:
                    throw new Error("Invalid arguments.");
            }
        } else {
            return message.channel.send(`Could not find this role.`);
        }

        // Reload roles
        roleBoundaries.set(message.guild.id, []);

        const updatedRoles = await roles.findAll({where: {guild: message.guild.id}});
        for (let currentRole of updatedRoles) {
            // Add role to collection
            roleBoundaries.get(message.guild.id).push({
                role: currentRole.get("role"),
                reactions: currentRole.get("reactions")
            });
        }
    }
};
