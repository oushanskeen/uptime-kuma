const { log } = require("../../src/util");
const { Settings } = require("../settings");
const { sendInfo } = require("../client");
const { checkLogin } = require("../util-server");
const GameResolver = require("gamedig/lib/GameResolver");

let gameResolver = new GameResolver();
let gameList = null;

/**
 * Get a game list via GameDig
 * @returns {Object[]} list of games supported by GameDig
 */
function getGameList() {

    log.debug("server/socket-handlers/docker-socket-handler.js/getGameList","");

    if (gameList == null) {
        gameList = gameResolver._readGames().games.sort((a, b) => {
            if ( a.pretty < b.pretty ) {
                return -1;
            }
            if ( a.pretty > b.pretty ) {
                return 1;
            }
            return 0;
        });
    }
    return gameList;
}

module.exports.generalSocketHandler = (socket, server) => {

    socket.on("initServerTimezone", async (timezone) => {

        log.debug("server/socket-handlers/general-socket-handler.js/generalSocketHandler(socket)/socket.on(initServerTimezone)","");

        try {
            checkLogin(socket);
            log.debug("generalSocketHandler", "Timezone: " + timezone);
            await Settings.set("initServerTimezone", true);
            await server.setTimezone(timezone);
            await sendInfo(socket);
        } catch (e) {
            log.warn("initServerTimezone", e.message);
        }
    });

    socket.on("getGameList", async (callback) => {

        log.debug("server/socket-handlers/general-socket-handler.js/generalSocketHandler(socket)/socket.on(getGameList)","");

        callback({
            ok: true,
            gameList: getGameList(),
        });
    });

};
