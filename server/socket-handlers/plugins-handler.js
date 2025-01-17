const { checkLogin } = require("../util-server");
const { PluginsManager } = require("../plugins-manager");
const { log } = require("../../src/util.js");

/**
 * Handlers for plugins
 * @param {Socket} socket Socket.io instance
 * @param {UptimeKumaServer} server
 */
module.exports.pluginsHandler = (socket, server) => {

    const pluginManager = server.getPluginManager();

    // Get Plugin List
    socket.on("getPluginList", async (callback) => {

        log.debug("server/socket-handlers/plugins-handler.js/pluginsHandler(socket)/socket.on(getPluginList)","");

        try {
            checkLogin(socket);

            log.debug("server/socket-handlers/plugins-handler.js/pluginsHandler(socket)/socket.on(getPluginList)", "PluginManager.disable: " + PluginsManager.disable);

            if (PluginsManager.disable) {
                throw new Error("Plugin Disabled: In order to enable plugin feature, you need to use the default data directory: ./data/");
            }

            let pluginList = await pluginManager.fetchPluginList();
            callback({
                ok: true,
                pluginList,
            });
        } catch (error) {
            log.warn("server/socket-handlers/plugins-handler.js/pluginsHandler(socket)/socket.on(getPluginList)", "Error: " + error.message);
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    socket.on("installPlugin", async (repoURL, name, callback) => {

        log.debug("server/socket-handlers/plugins-handler.js/pluginsHandler(socket)/socket.on(installPlugin)","");

        try {
            checkLogin(socket);
            pluginManager.downloadPlugin(repoURL, name);
            await pluginManager.loadPlugin(name);
            callback({
                ok: true,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });

    socket.on("uninstallPlugin", async (name, callback) => {

        log.debug("server/socket-handlers/plugins-handler.js/pluginsHandler(socket)/socket.on(uninstallPlugin)","");

        try {
            checkLogin(socket);
            await pluginManager.removePlugin(name);
            callback({
                ok: true,
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });
};
