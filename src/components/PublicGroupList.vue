<template>
    <!-- Group List -->
    <Draggable
        v-model="$root.publicGroupList"
        :disabled="!editMode"
        item-key="id"
        :animation="100"
    >
        <template #item="group">
            <div class="mb-5 ">
                <!-- Group Title -->
                <h2 class="group-title">
                    <font-awesome-icon v-if="editMode && showGroupDrag" icon="arrows-alt-v" class="action drag me-3" />
                    <font-awesome-icon v-if="editMode" icon="times" class="action remove me-3" @click="removeGroup(group.index)" />
                    <Editable v-model="group.element.name" :contenteditable="editMode" tag="span" />
                </h2>

                <div class="shadow-box monitor-list mt-4 position-relative">
                    <div v-if="group.element.monitorList.length === 0" class="text-center no-monitor-msg">
                        {{ $t("No Monitors") }}
                    </div>

                    <!-- Monitor List -->
                    <!-- animation is not working, no idea why -->
                    <Draggable
                        v-model="group.element.monitorList"
                        class="monitor-list"
                        group="same-group"
                        :disabled="!editMode"
                        :animation="100"
                        item-key="id"
                    >
                        <template #item="monitor">
                            <div class="item">
                                <div class="row">
                                    <div class="col-9 col-md-8 small-padding">
                                        <div class="info">
                                            <font-awesome-icon v-if="editMode" icon="arrows-alt-v" class="action drag me-3" />
                                            <font-awesome-icon v-if="editMode" icon="times" class="action remove me-3" @click="removeMonitor(group.index, monitor.index)" />

                                            <Uptime :monitor="monitor.element" type="24" :pill="true" />
                                            <a
                                                v-if="showLink(monitor)"
                                                :href="monitor.element.url"
                                                class="item-name"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {{ monitor.element.name }}
                                            </a>
                                            <p v-else class="item-name"> {{ monitor.element.name }} </p>
                                            <span
                                                v-if="showLink(monitor, true)"
                                                title="Toggle Clickable Link"
                                            >
                                                <font-awesome-icon
                                                    v-if="editMode"
                                                    :class="{'link-active': monitor.element.sendUrl, 'btn-link': true}"
                                                    icon="link" class="action me-3"

                                                    @click="toggleLink(group.index, monitor.index)"
                                                />
                                            </span>
                                        </div>
                                        <div v-if="showTags" class="tags">
                                            <Tag v-for="tag in monitor.element.tags" :key="tag" :item="tag" :size="'sm'" />
                                        </div>
                                    </div>

                                    <div :key="$root.userHeartbeatBar" class="col-3 col-md-4">
                                        <HeartbeatBar size="small" :monitor-id="monitor.element.id" />
                                    </div>

                                </div>

                                <div class="col">
                                    <PingChart :monitor-id="monitor.element.id" />
                                </div>

                                <div class="shadow-box big-padding text-center stats">
                                    <div class="row">

                                      <div class="col">
                                          <h4>Response</h4>
                                          <p>({{ $t("Current") }})</p>
                                          <span class="num">
                                            <span>{{ ping(monitor.element.id) }} ms</span>
                                          </span>
                                      </div>

                                      <div class="col">
                                          <h4>Avg. Response</h4>
                                          <p>({{ $t("24-hour") }})</p>
                                          <span class="num">
                                            <span>{{ avgPing(monitor.element.id) }} ms</span>
                                          </span>
                                      </div>

                                    <div class="col">
                                        <h4>{{ $t("Uptime") }}</h4>
                                        <p>(24{{ $t("-hour") }})</p>
                                        <span class="num">
                                            <span :class="className" :title="title">{{ uptime("24",monitor.element.id) }}</span>
                                        </span>
                                    </div>

                                    <div class="col">
                                        <h4>{{$t("Uptime") }}</h4>
                                        <p>(30{{ $t("-day") }})</p>
                                        <span class="num">
                                            <span :class="className" :title="title">{{ uptime("720",monitor.element.id) }}</span>
                                            </span>
                                    </div>

                                    </div>
                                </div>

                            </div>
                        </template>
                    </Draggable>
                </div>
            </div>
        </template>
    </Draggable>
</template>

<script>
import Draggable from "vuedraggable";
import HeartbeatBar from "./HeartbeatBar.vue";
import Uptime from "./Uptime.vue";
import Tag from "./Tag.vue";
import { defineAsyncComponent } from "vue";
const PingChart = defineAsyncComponent(() => import("../components/PingChart.vue"));

export default {
    components: {
        Draggable,
        HeartbeatBar,
        Uptime,
        PingChart,
        Tag,
    },
    props: {
        /** Are we in edit mode? */
        editMode: {
            type: Boolean,
            required: true,
        },
        /** Should tags be shown? */
        showTags: {
            type: Boolean,
        }
    },
    data() {
        return {
            monitor: null,
            unit: {
              type: String,
              default: "ms",
            },
        };
    },
    async mounted() {
        this.slug = this.overrideSlug || this.$route.params.slug;

        if (!this.slug) {
            this.slug = "default";
        }

        this.getData().then((res) => {
            this.config = res.data.config;

            if (!this.config.domainNameList) {
                this.config.domainNameList = [];
      у       }

            if (this.config.icon) {
                this.imgDataUrl = this.config.icon;
            }

            this.incident = res.data.incident;
            this.maintenanceList = res.data.maintenanceList;
            this.$root.publicGroupList = res.data.publicGroupList;
        }).catch(function (error) {
            if (error.response.status === 404) {
                location.href = "/page-not-found";
            }
            console.log(error);
            console.log("Root publicGroupList res: ");
        });

        // Configure auto-refresh loop
        this.updateHeartbeatList();
        feedInterval = setInterval(() => {
            this.updateHeartbeatList();
        }, (this.autoRefreshInterval * 60 + 10) * 1000);

        this.updateUpdateTimer();

        // Go to edit page if ?edit present
        // null means ?edit present, but no value
        if (this.$route.query.edit || this.$route.query.edit === null) {
            this.edit();
        }
},
    computed: {
        showGroupDrag() {
            return (this.$root.publicGroupList.length >= 2);
        }
    },
    created() {

    },
    methods: {
        /**
         * Remove the specified group
         * @param {number} index Index of group to remove
         */
        removeGroup(index) {
            this.$root.publicGroupList.splice(index, 1);
        },

        avgPing(monitorId) {
            console.log("M: [PublicGroupList.vue/script/computed/avgPing] monitor.id: ", monitorId)
            //try{
                if (this.$root.avgPingList[monitorId] || this.$root.avgPingList[monitorId] === 0) {
                    return this.$root.avgPingList[monitorId];
                }
            //}catch(err){
            //    <!-- return err -->
            //}

            return this.$t("notAvailableShort");
            //return () => monitorId
            //return "monitorId"
        },
        lastHeartBeat(monitorId) {  
            //console.log("lastHeartbeatList: ", this.$root.lastHeartbeatList)
            try{
                console.log("lastHeartbeatList: ", this.$root.lastHeartbeatList["1"].ping)
                //this.$root.lastHeartbeatList["1"]
                if (this.$root.lastHeartbeatList && this.$root.lastHeartbeatList[monitorId]) {
                    return this.$root.lastHeartbeatList[monitorId];
                }
            }catch(err){
                return "" + err
            }

            return {
                status: -1,
            };
        },
        ping(monitorId) {

            //try{
                if (this.lastHeartBeat(monitorId).ping || this.lastHeartBeat(monitorId).ping === 0) {
                    return this.lastHeartBeat(monitorId).ping;
                }
            //}catch(e){
            //    return this.lastHeartBeat(monitorId)
            //}

            return this.$t("notAvailableShort");
        },
        uptime(type, monitorId) {
            if (this.type === "maintenance") {
                return this.$t("statusMaintenance");
            }

            let key = monitorId + "_" + type;
            

            if (this.$root.uptimeList[key] !== undefined) {
                let result = Math.round(this.$root.uptimeList[key] * 10000) / 100;
                // Only perform sanity check on status page. See louislam/uptime-kuma#2628
                if (this.$route.path.startsWith("/status") && result > 100) {
                    return "100%";
                } else {
                    return result + "%";
                }
            }

            //return this.$root.uptimeList
            //return key

            return this.$t("notAvailableShort");
        },
        async value(from, to) {
            let diff = to - from;
            let frames = 12;
            let step = Math.floor(diff / frames);

            if (! (isNaN(step) || ! this.isNum || (diff > 0 && step < 1) || (diff < 0 && step > 1) || diff === 0)) {
                for (let i = 1; i < frames; i++) {
                    this.output += step;
                    await sleep(15);
                }
            }

            this.output = this.value;
        },

        /**
         * Remove a monitor from a group
         * @param {number} groupIndex Index of group to remove monitor
         * from
         * @param {number} index Index of monitor to remove
         */
        removeMonitor(groupIndex, index) {
            this.$root.publicGroupList[groupIndex].monitorList.splice(index, 1);
        },

        /**
         * Toggle the value of sendUrl
         * @param {number} groupIndex Index of group monitor is member of
         * @param {number} index Index of monitor within group
         */
        toggleLink(groupIndex, index) {
            this.$root.publicGroupList[groupIndex].monitorList[index].sendUrl = !this.$root.publicGroupList[groupIndex].monitorList[index].sendUrl;
        },

        /**
         * Should a link to the monitor be shown?
         * Attempts to guess if a link should be shown based upon if
         * sendUrl is set and if the URL is default or not.
         * @param {Object} monitor Monitor to check
         * @param {boolean} [ignoreSendUrl=false] Should the presence of the sendUrl
         * property be ignored. This will only work in edit mode.
         * @returns {boolean}
         */
        showLink(monitor, ignoreSendUrl = false) {
            // We must check if there are any elements in monitorList to
            // prevent undefined errors if it hasn't been loaded yet
            if (this.$parent.editMode && ignoreSendUrl && Object.keys(this.$root.monitorList).length) {
                return this.$root.monitorList[monitor.element.id].type === "http" || this.$root.monitorList[monitor.element.id].type === "keyword";
            }
            return monitor.element.sendUrl && monitor.element.url && monitor.element.url !== "https://" && !this.editMode;
        },

        /**
         * Return the correct title for the ping stat
         * @param {boolean} [average=false] Is the statistic an average?
         * @returns {string} Title formated dependant on monitor type
         */
        pingTitle(average = false) {
            let translationPrefix = "";
            if (average) {
                translationPrefix = "Avg. ";
            }

            if (this.monitor.type === "http") {
                return this.$t(translationPrefix + "Response");
            }

            return this.$t(translationPrefix + "Ping");
        },
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

.no-monitor-msg {
    position: absolute;
    width: 100%;
    top: 20px;
    left: 0;
}

.monitor-list {
    min-height: 46px;
}

.item-name {
    padding-left: 5px;
    padding-right: 5px;
    margin: 0;
    display: inline-block;
}

.btn-link {
    color: #bbbbbb;
    margin-left: 5px;
}

.link-active {
    color: $primary;
}

.flip-list-move {
    transition: transform 0.5s;
}

.no-move {
    transition: transform 0s;
}

.drag {
    color: #bbb;
    cursor: grab;
}

.remove {
    color: $danger;
}

.group-title {
    span {
        display: inline-block;
        min-width: 15px;
    }
}

.mobile {
    .item {
        padding: 13px 0 10px;
    }
}

.bg-maintenance {
    background-color: $maintenance;
}

</style>
