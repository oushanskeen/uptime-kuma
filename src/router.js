import { createRouter, createWebHistory } from "vue-router";

import EmptyLayout from "./layouts/EmptyLayout.vue";
import Layout from "./layouts/Layout.vue";
import Dashboard from "./pages/Dashboard.vue";
import DashboardHome from "./pages/DashboardHome.vue";
import Details from "./pages/Details.vue";
import EditMonitor from "./pages/EditMonitor.vue";
import EditMaintenance from "./pages/EditMaintenance.vue";
import List from "./pages/List.vue";
const Settings = () => import("./pages/Settings.vue");
import Setup from "./pages/Setup.vue";
import StatusPage from "./pages/StatusPage.vue";
import AdminPage from "./pages/AdminPage.vue";
import Entry from "./pages/Entry.vue";
import ManageStatusPage from "./pages/ManageStatusPage.vue";
import AddStatusPage from "./pages/AddStatusPage.vue";
import NotFound from "./pages/NotFound.vue";
import DockerHosts from "./components/settings/Docker.vue";
import MaintenanceDetails from "./pages/MaintenanceDetails.vue";
import ManageMaintenance from "./pages/ManageMaintenance.vue";
import APIKeys from "./components/settings/APIKeys.vue";
import Plugins from "./components/settings/Plugins.vue";

// Settings - Sub Pages
import Appearance from "./components/settings/Appearance.vue";
import General from "./components/settings/General.vue";
const Notifications = () => import("./components/settings/Notifications.vue");
import ReverseProxy from "./components/settings/ReverseProxy.vue";
import Tags from "./components/settings/Tags.vue";
import MonitorHistory from "./components/settings/MonitorHistory.vue";
const Security = () => import("./components/settings/Security.vue");
import Proxies from "./components/settings/Proxies.vue";
import Backup from "./components/settings/Backup.vue";
import About from "./components/settings/About.vue";

// import.meta.env.VITE_ADMIN == undefined
// ? import.meta.env.VITE_ADMIN  = false
// : import.meta.env.VITE_ADMIN 

// localStorage.setItem('storedData', false)

const privateRoutes = [
    {
        path: "/",
        //component: Entry,
        redirect: () => {
            return "/status/" + import.meta.env.VITE_PUBLIC_DASHBOARD_NAME
        }
    },
    {
        // If it is "/dashboard", the active link is not working
        // If it is "", it overrides the "/" unexpectedly
        // Give a random name to solve the problem.
        path: "/empty",
        component: Layout,
        children: [
            {
                path: "",
                component: Dashboard,
                children: [
                    {
                        name: "DashboardHome",
                        path: "/dashboard",
                        component: DashboardHome,
                        children: [
                            {
                                path: "/dashboard/:id",
                                component: EmptyLayout,
                                children: [
                                    {
                                        path: "",
                                        component: Details,
                                    },
                                    {
                                        path: "/edit/:id",
                                        component: EditMonitor,
                                    },
                                ],
                            },
                            {
                                path: "/clone/:id",
                                component: EditMonitor,
                            },
                            {
                                path: "/add",
                                component: EditMonitor,
                            },
                        ],
                    },
                    {
                        path: "/list",
                        component: List,
                    },
                    {
                        path: "/settings",
                        component: Settings,
                        children: [
                            {
                                path: "general",
                                component: General,
                            },
                            {
                                path: "appearance",
                                component: Appearance,
                            },
                            {
                                path: "notifications",
                                component: Notifications,
                            },
                            {
                                path: "reverse-proxy",
                                component: ReverseProxy,
                            },
                            {
                                path: "tags",
                                component: Tags,
                            },
                            {
                                path: "monitor-history",
                                component: MonitorHistory,
                            },
                            {
                                path: "docker-hosts",
                                component: DockerHosts,
                            },
                            {
                                path: "security",
                                component: Security,
                            },
                            {
                                path: "api-keys",
                                component: APIKeys,
                            },
                            {
                                path: "proxies",
                                component: Proxies,
                            },
                            {
                                path: "backup",
                                component: Backup,
                            },
                            {
                                path: "plugins",
                                component: Plugins,
                            },
                            {
                                path: "about",
                                component: About,
                            },
                        ]
                    },
                    {
                        path: "/manage-status-page",
                        component: ManageStatusPage,
                    },
                    {
                        path: "/add-status-page",
                        component: AddStatusPage,
                    },
                    {
                        path: "/maintenance",
                        component: ManageMaintenance,
                    },
                    {
                        path: "/maintenance/:id",
                        component: MaintenanceDetails,
                    },
                    {
                        path: "/add-maintenance",
                        component: EditMaintenance,
                    },
                    {
                        path: "/maintenance/edit/:id",
                        component: EditMaintenance,
                    },
                ],
                beforeEnter: (to, from) => {
                    console.log("localStorage.getItem('storedData'): ", localStorage.getItem('storedData'))
                    return localStorage.getItem('isAdminHere') == 'admin is here' ? true : false
                },
            },
        ],
    },
    {
        path: "/setup",
        component: Setup,
    },
    {
        path: "/status-page",
        component: StatusPage,
    },
    {
        path: "/status",
        component: StatusPage,
    },
    {
        path: "/status/:slug",
        component: StatusPage,
    },
    {
        path: "/:pathMatch(.*)*",
        component: NotFound,
    },
    {
        path: "/admin",
        component: AdminPage,
    },
];

const publicRoutes = [
    {
        path: "/status/:slug",
        component: StatusPage,
    },
    {
        path: "/admin",
        component: AdminPage,
    },
    {
        path: "/:pathMatch(.*)*",
        component: NotFound,
    },
];

const routes = privateRoutes

export const router = createRouter({
    linkActiveClass: "active",
    history: createWebHistory(),
    routes,
});

// router.beforeEach(async (to, from) => {
//   // if (
//   //   // make sure the user is authenticated
//   //   !isAuthenticated &&
//   //   // ❗️ Avoid an infinite redirect
//   //   to.name !== 'Login'
//   // ) {

//     const goToStatusPage = localStorage.getItem('isAdminHere') == 'admin is here' ? true : false
//     // redirect the user to the login page
//     if(true){
//         return { name: to.name }
//     }else{
//         return { name: '/admin' }
//     }
//   //}
// })

// export router