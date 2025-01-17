const { BeanModel } = require("redbean-node/dist/bean-model");
const { log } = require("../../src/util");

/**
 * status:
 *      0 = DOWN
 *      1 = UP
 *      2 = PENDING
 *      3 = MAINTENANCE
 */
class Heartbeat extends BeanModel {

    /**
     * Return an object that ready to parse to JSON for public
     * Only show necessary data to public
     * @returns {Object}
     */
    toPublicJSON() {

        log.debug("server/model/heartbeat.js/Heartbeat/toPublicJSON()",``);

        return {
            status: this.status,
            time: this.time,
            msg: "",        // Hide for public
            ping: this.ping,
        };
    }

    /**
     * Return an object that ready to parse to JSON
     * @returns {Object}
     */
    toJSON() {
        log.debug("server/model/heartbeat.js/Heartbeat/toJSON()",``);
        return {
            monitorID: this.monitor_id,
            status: this.status,
            time: this.time,
            msg: this.msg,
            ping: this.ping,
            important: this.important,
            duration: this.duration,
        };
    }

}

module.exports = Heartbeat;
