const { BeanModel } = require("redbean-node/dist/bean-model");
const { R } = require("redbean-node");
const cheerio = require("cheerio");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const jsesc = require("jsesc");
const googleAnalytics = require("../google-analytics");
const { log } = require("../../src/util");

class StatusPage extends BeanModel {

    /**
     * Like this: { "test-uptime.kuma.pet": "default" }
     * @type {{}}
     */
    static domainMappingList = { };

    /**
     *
     * @param {Response} response
     * @param {string} indexHTML
     * @param {string} slug
     */
    static async handleStatusPageResponse(response, indexHTML, slug) {

      log.debug("server/model/status_page.js/StatusPage/handleStatusPageResponse(response, indexHTML, slug)",``);

        let statusPage = await R.findOne("status_page", " slug = ? ", [
            slug
        ]);
        log.debug("server/model/status_page.js/StatusPage/handleStatusPageResponse(response, indexHTML, slug)",
        `R.findOne("status_page", " slug = ${slug} ")`);

        if (statusPage) {
            response.send(await StatusPage.renderHTML(indexHTML, statusPage));
        } else {
            response.status(404).send(UptimeKumaServer.getInstance().indexHTML);
        }
    }

    /**
     * SSR for status pages
     * @param {string} indexHTML
     * @param {StatusPage} statusPage
     */
    static async renderHTML(indexHTML, statusPage) {

        log.debug("server/model/status_page.js/StatusPage/renderHTML(indexHTML, statusPage)",``);

        const $ = cheerio.load(indexHTML);
        const description155 = statusPage.description?.substring(0, 155) ?? "";

        $("title").text(statusPage.title);
        $("meta[name=description]").attr("content", description155);

        if (statusPage.icon) {
            $("link[rel=icon]")
                .attr("href", statusPage.icon)
                .removeAttr("type");

            $("link[rel=apple-touch-icon]").remove();
        }

        const head = $("head");

        if (statusPage.googleAnalyticsTagId) {
            let escapedGoogleAnalyticsScript = googleAnalytics.getGoogleAnalyticsScript(statusPage.googleAnalyticsTagId);
            head.append($(escapedGoogleAnalyticsScript));
        }

        // OG Meta Tags
        let ogTitle = $("<meta property=\"og:title\" content=\"\" />").attr("content", statusPage.title);
        head.append(ogTitle);

        let ogDescription = $("<meta property=\"og:description\" content=\"\" />").attr("content", description155);
        head.append(ogDescription);

        // Preload data
        // Add jsesc, fix https://github.com/louislam/uptime-kuma/issues/2186
        const escapedJSONObject = jsesc(await StatusPage.getStatusPageData(statusPage), {
            "isScriptContext": true
        });

        const script = $(`
            <script id="preload-data" data-json="{}">
                window.preloadData = ${escapedJSONObject};
            </script>
        `);

        head.append(script);

        // manifest.json
        $("link[rel=manifest]").attr("href", `/api/status-page/${statusPage.slug}/manifest.json`);

        return $.root().html();
    }

    /**
     * Get all status page data in one call
     * @param {StatusPage} statusPage
     */
    static async getStatusPageData(statusPage) {

        log.debug("server/model/status_page.js/StatusPage/getStatusPageData(statusPage)",``);

        // Incident
        let incident = await R.findOne("incident", " pin = 1 AND active = 1 AND status_page_id = ? ", [
            statusPage.id,
        ]);
        log.debug("server/model/status_page.js/StatusPage/getStatusPageData(statusPage)",
        ` R.findOne("incident", " pin = 1 AND active = 1 AND status_page_id = ${statusPage.id} ")`);

        if (incident) {
            incident = incident.toPublicJSON();
        }

        let maintenanceList = await StatusPage.getMaintenanceList(statusPage.id);

        // Public Group List
        const publicGroupList = [];
        const showTags = !!statusPage.show_tags;

        const list = await R.find("group", " public = 1 AND status_page_id = ? ORDER BY weight ", [
            statusPage.id
        ]);
        log.debug("server/model/status_page.js/StatusPage/getStatusPageData(statusPage)",
        `R.find("group", " public = 1 AND status_page_id = ${statusPage.id} ORDER BY weight ")`);

        for (let groupBean of list) {
            let monitorGroup = await groupBean.toPublicJSON(showTags);
            publicGroupList.push(monitorGroup);
        }

        // Response
        return {
            config: await statusPage.toPublicJSON(),
            incident,
            publicGroupList,
            maintenanceList,
        };
    }

    /**
     * Loads domain mapping from DB
     * Return object like this: { "test-uptime.kuma.pet": "default" }
     * @returns {Promise<void>}
     */
    static async loadDomainMappingList() {

       log.debug("server/model/status_page.js/StatusPage/loadDomainMappingList()",``);

        StatusPage.domainMappingList = await R.getAssoc(`
            SELECT domain, slug
            FROM status_page, status_page_cname
            WHERE status_page.id = status_page_cname.status_page_id
        `);
        log.debug("server/model/status_page.js/StatusPage/loadDomainMappingList()",
        `R.getAssoc(
            SELECT domain, slug
            FROM status_page, status_page_cname
            WHERE status_page.id = status_page_cname.status_page_id
        )`);
    }

    /**
     * Send status page list to client
     * @param {Server} io io Socket server instance
     * @param {Socket} socket Socket.io instance
     * @returns {Promise<Bean[]>}
     */
    static async sendStatusPageList(io, socket) {

        log.debug("server/model/status_page.js/StatusPage/sendStatusPageList(io, socket)",``);

        let result = {};

        let list = await R.findAll("status_page", " ORDER BY title ");
        log.debug("server/model/status_page.js/StatusPage/sendStatusPageList(io,socket)",
        `R.findAll("status_page", " ORDER BY title ")`);

        for (let item of list) {
            result[item.id] = await item.toJSON();
        }

        io.to(socket.userID).emit("statusPageList", result);
        return list;
    }

    /**
     * Update list of domain names
     * @param {string[]} domainNameList
     * @returns {Promise<void>}
     */
    async updateDomainNameList(domainNameList) {

        log.debug("server/model/status_page.js/StatusPage/updateDomainNameList(domainNameList)",``);

        if (!Array.isArray(domainNameList)) {
            throw new Error("Invalid array");
        }

        let trx = await R.begin();
        log.debug("server/model/status_page.js/StatusPage/updateDomainNameList(domainNameList)",
        `R.begin()`);

        await trx.exec("DELETE FROM status_page_cname WHERE status_page_id = ?", [
            this.id,
        ]);
        log.debug("server/model/status_page.js/StatusPage/updateDomainNameList(domainNameList)",
        `trx.exec("DELETE FROM status_page_cname WHERE status_page_id = ${this.id}")`);

        try {
            for (let domain of domainNameList) {
                if (typeof domain !== "string") {
                    throw new Error("Invalid domain");
                }

                if (domain.trim() === "") {
                    continue;
                }

                // If the domain name is used in another status page, delete it
                await trx.exec("DELETE FROM status_page_cname WHERE domain = ?", [
                    domain,
                ]);
                log.debug("server/model/status_page.js/StatusPage/updateDomainNameList(domainNameList)",
                `trx.exec("DELETE FROM status_page_cname WHERE domain = ${domain}")`);

                let mapping = trx.dispense("status_page_cname");
                log.debug("server/model/status_page.js/StatusPage/updateDomainNameList(domainNameList)",
                `trx.dispense("status_page_cname")`);

                mapping.status_page_id = this.id;
                mapping.domain = domain;
                await trx.store(mapping);
                log.debug("server/model/status_page.js/StatusPage/updateDomainNameList(domainNameList)",
                `trx.store(mapping)`);
            }
            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Get list of domain names
     * @returns {Object[]}
     */
    getDomainNameList() {

        log.debug("server/model/status_page.js/StatusPage/getDomainNameList()",``);

        let domainList = [];
        for (let domain in StatusPage.domainMappingList) {
            let s = StatusPage.domainMappingList[domain];

            if (this.slug === s) {
                domainList.push(domain);
            }
        }
        return domainList;
    }

    /**
     * Return an object that ready to parse to JSON
     * @returns {Object}
     */
    async toJSON() {
        log.debug("server/model/status_page.js/StatusPage/toJSON()",``);
        return {
            id: this.id,
            slug: this.slug,
            title: this.title,
            description: this.description,
            icon: this.getIcon(),
            theme: this.theme,
            published: !!this.published,
            showTags: !!this.show_tags,
            domainNameList: this.getDomainNameList(),
            customCSS: this.custom_css,
            footerText: this.footer_text,
            showPoweredBy: !!this.show_powered_by,
            googleAnalyticsId: this.google_analytics_tag_id,
        };
    }

    /**
     * Return an object that ready to parse to JSON for public
     * Only show necessary data to public
     * @returns {Object}
     */
    async toPublicJSON() {
        log.debug("server/model/status_page.js/StatusPage/toPublicJSON()",``);
        return {
            slug: this.slug,
            title: this.title,
            description: this.description,
            icon: this.getIcon(),
            theme: this.theme,
            published: !!this.published,
            showTags: !!this.show_tags,
            customCSS: this.custom_css,
            footerText: this.footer_text,
            showPoweredBy: !!this.show_powered_by,
            googleAnalyticsId: this.google_analytics_tag_id,
        };
    }

    /**
     * Convert slug to status page ID
     * @param {string} slug
     */
    static async slugToID(slug) {
        log.debug("server/model/status_page.js/StatusPage/slugToID(slug)",``);

        // let debugData = await R.findAll("SELECT * FROM status_page");
        // log.debug("server/model/status_page.js/StatusPage/handleStatusPageResponse(response, indexHTML, slug)",
        // `R.findAll("SELECT * FROM status_page")`);

        // log.debug("server/model/status_page.js/StatusPage/slugToID(slug)",
        // "debug data: " + JSON.stringify(debugData));

        log.debug("server/model/status_page.js/StatusPage/slugToID(slug)",
        `R.getCell("SELECT id FROM status_page WHERE slug = ${slug}"`);
        return await R.getCell("SELECT id FROM status_page WHERE slug = ? ", [
            slug
        ]);
    }

    /**
     * Get path to the icon for the page
     * @returns {string}
     */
    getIcon() {

        log.debug("server/model/status_page.js/StatusPage/getIcon()",``);

        /*
        if (!this.icon) {
            return "/icon.svg";
        } else {
            return this.icon;
        }
        */
    }

    /**
     * Get list of maintenances
     * @param {number} statusPageId ID of status page to get maintenance for
     * @returns {Object} Object representing maintenances sanitized for public
     */
    static async getMaintenanceList(statusPageId) {

        log.debug("server/model/status_page.js/StatusPage/getMaintenanceList(statusPageId)",``);

        try {
            const publicMaintenanceList = [];

            let maintenanceIDList = await R.getCol(`
                SELECT DISTINCT maintenance_id
                FROM maintenance_status_page
                WHERE status_page_id = ?
            `, [ statusPageId ]);
            log.debug("server/model/status_page.js/StatusPage/getMaintenanceList(statusPageId",
            `R.getCol(
                SELECT DISTINCT maintenance_id
                FROM maintenance_status_page
                WHERE status_page_id = ${statusPageId}
            `);

            for (const maintenanceID of maintenanceIDList) {
                let maintenance = UptimeKumaServer.getInstance().getMaintenance(maintenanceID);
                if (maintenance && await maintenance.isUnderMaintenance()) {
                    publicMaintenanceList.push(await maintenance.toPublicJSON());
                }
            }

            return publicMaintenanceList;

        } catch (error) {
            return [];
        }
    }
}

module.exports = StatusPage;
