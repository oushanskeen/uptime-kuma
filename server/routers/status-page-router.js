let express = require("express");
const apicache = require("../modules/apicache");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const StatusPage = require("../model/status_page");
const { allowDevAllOrigin, sendHttpError } = require("../util-server");
const { R } = require("redbean-node");
const Monitor = require("../model/monitor");
const { log } = require("../../src/util");

let router = express.Router();

let cache = apicache.middleware;
const server = UptimeKumaServer.getInstance();

router.get("/status/:slug", cache("5 minutes"), async (request, response) => {
    log.debug("server/routers/status-page-router.js/router.get(/status/:slug)",``);
    let slug = request.params.slug;
    await StatusPage.handleStatusPageResponse(response, server.indexHTML, slug);
});

router.get("/status", cache("5 minutes"), async (request, response) => {
    log.debug("server/routers/status-page-router.js/router.get(/status)",``);
    let slug = "default";
    await StatusPage.handleStatusPageResponse(response, server.indexHTML, slug);
});

router.get("/status-page", cache("5 minutes"), async (request, response) => {
    log.debug("server/routers/status-page-router.js/router.get(/status-page)",``);
    let slug = "default";
    await StatusPage.handleStatusPageResponse(response, server.indexHTML, slug);
});

// Status page config, incident, monitor list
router.get("/api/status-page/:slug", cache("5 minutes"), async (request, response) => {

    log.debug("server/routers/status-page-router.js/router.get(/api/status-page/:slug)",``);

    allowDevAllOrigin(response);
    let slug = request.params.slug;

    try {
        // Get Status Page
        let statusPage = await R.findOne("status_page", " slug = ? ", [
            slug
        ]);
        log.debug("server/routers/status-page-router.js/router.get(/api/badge/:id/response)",
        `R.findOne("status_page", " slug = ${slug}"`
        );

        if (!statusPage) {
            return null;
        }

        let statusPageData = await StatusPage.getStatusPageData(statusPage);

        if (!statusPageData) {
            sendHttpError(response, "Not Found");
            return;
        }

        // Response
        response.json(statusPageData);

    } catch (error) {
        sendHttpError(response, error.message);
    }
});

// Status Page Polling Data
// Can fetch only if published
router.get("/api/status-page/heartbeat/:slug", cache("1 minutes"), async (request, response) => {

    log.debug("server/routers/status-page-router.js/router.get(/api/status-page/heartbeat/:slug)",``);

    allowDevAllOrigin(response);

    try {
        let heartbeatList = {};
        let uptimeList = {};

        let slug = request.params.slug;
        let statusPageID = await StatusPage.slugToID(slug);

        let monitorIDList = await R.getCol(`
            SELECT monitor_group.monitor_id FROM monitor_group, \`group\`
            WHERE monitor_group.group_id = \`group\`.id
            AND public = 1
            AND \`group\`.status_page_id = ?
        `, [
            statusPageID
        ]);
        log.debug("server/routers/status-page-router.js/router.get(/api/status-page/heartbeat/:slug)",
        `R.getCol(
            SELECT monitor_group.monitor_id FROM monitor_group, \`group\`
            WHERE monitor_group.group_id = \`group\`.id
            AND public = 1
            AND \`group\`.status_page_id = ${statusPageID}
        `
        );

        for (let monitorID of monitorIDList) {
            let list = await R.getAll(`
                    SELECT * FROM heartbeat
                    WHERE monitor_id = ?
                    ORDER BY time DESC
                    LIMIT 50
            `, [
                monitorID,
            ]);
            log.debug("server/routers/status-page-router.js/router.get(/api/status-page/heartbeat/:slug)",
            `R.getAll(
                   SELECT * FROM heartbeat
                   WHERE monitor_id = ${monitorID}
                   ORDER BY time DESC
                   LIMIT 50
           `
            );

            list = R.convertToBeans("heartbeat", list);
            log.debug("server/routers/status-page-router.js/router.get(/api/status-page/heartbeat/:slug)",
            `R.convertToBeans("heartbeat", ${JSON.stringify(list)})`);
            heartbeatList[monitorID] = list.reverse().map(row => row.toPublicJSON());

            const type = 24;
            uptimeList[`${monitorID}_${type}`] = await Monitor.calcUptime(type, monitorID);
        }

        response.json({
            heartbeatList,
            uptimeList
        });

    } catch (error) {
        sendHttpError(response, error.message);
    }
});

// Status page's manifest.json
router.get("/api/status-page/:slug/manifest.json", cache("1440 minutes"), async (request, response) => {

    log.debug("server/routers/status-page-router.js/router.get(/api/status-page/:slug/manifest.json)",``);

    allowDevAllOrigin(response);
    let slug = request.params.slug;

    try {
        // Get Status Page
        let statusPage = await R.findOne("status_page", " slug = ? ", [
            slug
        ]);
        log.debug("server/routers/status-page-router.js/router.get(/api/status-page/:slug/manifest.json)",
        `R.findOne("status_page", " slug = ${slug} "`);

        if (!statusPage) {
            sendHttpError(response, "Not Found");
            return;
        }

        // Response
        response.json({
            "name": statusPage.title,
            "start_url": "/status/" + statusPage.slug,
            "display": "standalone",
            "icons": [
                {
                    "src": statusPage.icon,
                    "sizes": "128x128",
                    "type": "image/png"
                }
            ]
        });

    } catch (error) {
        sendHttpError(response, error.message);
    }
});

module.exports = router;
