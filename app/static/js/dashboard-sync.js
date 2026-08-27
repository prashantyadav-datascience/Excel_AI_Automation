// =========================================================
// EXCEL AI AUTOMATION
// UNIFIED DASHBOARD DATASET SYNCHRONIZATION

// =========================================================

console.log("dashboard-sync.js loaded.");


// =========================================================
// GLOBAL STATE
// =========================================================

let unifiedSelectedFileId = null;


// =========================================================
// GET CURRENT SELECTED FILE
// =========================================================

function getUnifiedSelectedFileId() {

    const storedFileId =
        localStorage.getItem("selected_file_id");

    if (storedFileId) {
        return String(storedFileId);
    }

    return null;
}


// =========================================================
// SET DATASET
// =========================================================

function setUnifiedDataset(fileId, options = {}) {

    if (
        fileId === null ||
        fileId === undefined ||
        fileId === ""
    ) {
        console.warn(
            "Unified dataset sync: invalid file ID."
        );

        return;
    }


    fileId = String(fileId);

    unifiedSelectedFileId = fileId;


    // -----------------------------------------------------
    // SAVE CENTRAL DATASET
    // -----------------------------------------------------

    localStorage.setItem(
        "selected_file_id",
        fileId
    );


    localStorage.setItem(
        "selectedFileId",
        fileId
    );


    localStorage.setItem(
        "current_file_id",
        fileId
    );


    // -----------------------------------------------------
    // SYNC ALL FILE SELECTORS
    // -----------------------------------------------------

    syncAllFileSelectors(fileId);


    // -----------------------------------------------------
    // DISPATCH GLOBAL EVENT
    // -----------------------------------------------------

    const event =
        new CustomEvent(
            "dashboardDatasetChanged",
            {
                detail: {
                    fileId: fileId,
                    source:
                        options.source || "dashboard",
                    timestamp:
                        Date.now()
                }
            }
        );


    window.dispatchEvent(event);


    console.log(
        "Unified dataset changed:",
        fileId
    );
}


// =========================================================
// SYNC ALL SELECTORS
// =========================================================

function syncAllFileSelectors(fileId) {

    const selectors = [
        "#kpiFileSelector",
        "#fileSelector",
        "#dashboardFileSelector",
        "#fileSelect",
        "#file_id",
        "#selectedFile"
    ];


    selectors.forEach(
        selector => {

            const element =
                document.querySelector(
                    selector
                );


            if (!element) {
                return;
            }


            if (
                element.value !== fileId
            ) {

                element.value =
                    fileId;
            }

        }
    );
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        unifiedSelectedFileId =
            getUnifiedSelectedFileId();


        if (
            unifiedSelectedFileId
        ) {

            syncAllFileSelectors(
                unifiedSelectedFileId
            );

            console.log(
                "Unified dataset restored:",
                unifiedSelectedFileId
            );
        }


        initializeUnifiedFileSelectors();

    }
);


// =========================================================
// FILE SELECTOR LISTENER
// =========================================================

function initializeUnifiedFileSelectors() {

    const selectors = [
        "#kpiFileSelector",
        "#fileSelector",
        "#dashboardFileSelector",
        "#fileSelect",
        "#file_id",
        "#selectedFile"
    ];


    selectors.forEach(
        selector => {

            const element =
                document.querySelector(
                    selector
                );


            if (!element) {
                return;
            }


            // Prevent duplicate listeners

            if (
                element.dataset
                    .unifiedSyncAttached === "true"
            ) {
                return;
            }


            element.dataset
                .unifiedSyncAttached = "true";


            element.addEventListener(
                "change",
                function () {

                    const fileId =
                        this.value;


                    if (!fileId) {

                        console.warn(
                            "No dataset selected."
                        );

                        return;
                    }


                    setUnifiedDataset(
                        fileId,
                        {
                            source:
                                selector
                        }
                    );

                }
            );

        }
    );
}


// =========================================================
// GLOBAL DATASET CHANGE EVENT
// =========================================================

window.addEventListener(
    "dashboardDatasetChanged",
    function (event) {

        const fileId =
            event.detail?.fileId;


        if (!fileId) {
            return;
        }


        console.log(
            "Syncing dashboard modules:",
            fileId
        );


        // -------------------------------------------------
        // KPI
        // -------------------------------------------------

        if (
            typeof window.loadKPIs ===
            "function"
        ) {

            window.loadKPIs(
                fileId
            );

        }


        // -------------------------------------------------
        // BUSINESS INSIGHTS
        // -------------------------------------------------

        if (
            typeof window.loadBusinessInsights ===
            "function"
        ) {

            window.loadBusinessInsights(
                fileId
            );

        }


        // -------------------------------------------------
        // ADVANCED ANALYTICS
        // -------------------------------------------------

        if (
            typeof window.loadAdvancedAnalytics ===
            "function"
        ) {

            window.loadAdvancedAnalytics(
                fileId
            );

        }

    }
);


// =========================================================
// MANUAL GLOBAL REFRESH
// =========================================================

window.refreshAllDashboardModules =
    function () {

        const fileId =
            unifiedSelectedFileId ||
            getUnifiedSelectedFileId();


        if (!fileId) {

            console.warn(
                "No dataset available for dashboard refresh."
            );

            return;
        }


        console.log(
            "Refreshing all dashboard modules:",
            fileId
        );


        if (
            typeof window.loadKPIs ===
            "function"
        ) {

            window.loadKPIs(
                fileId
            );
        }


        if (
            typeof window.loadBusinessInsights ===
            "function"
        ) {

            window.loadBusinessInsights(
                fileId
            );
        }


        if (
            typeof window.loadAdvancedAnalytics ===
            "function"
        ) {

            window.loadAdvancedAnalytics(
                fileId
            );
        }

    };


// =========================================================
// GLOBAL GETTER
// =========================================================

// =========================================================
// GET UNIFIED SELECTED FILE ID
// =========================================================

window.getUnifiedSelectedFileId = function () {

    // 1. KPI selector
    const kpiSelector =
        document.getElementById("kpiFileSelector");

    if (
        kpiSelector &&
        kpiSelector.value
    ) {
        return String(kpiSelector.value);
    }


    // 2. Other dashboard selectors
    const selectors = [
        "fileSelector",
        "dashboardFileSelector",
        "fileSelect",
        "file_id",
        "selectedFile"
    ];

    for (const id of selectors) {

        const element =
            document.getElementById(id);

        if (
            element &&
            element.value
        ) {
            return String(element.value);
        }
    }


    // 3. LocalStorage
    const storedFileId =
        localStorage.getItem(
            "selected_file_id"
        );

    if (storedFileId) {
        return String(storedFileId);
    }


    // 4. URL
    const params =
        new URLSearchParams(
            window.location.search
        );

    const urlFileId =
        params.get("file_id");

    if (urlFileId) {
        return String(urlFileId);
    }


    return null;
};


// =========================================================
// GLOBAL SETTER
// =========================================================

window.setUnifiedDataset =
    setUnifiedDataset;


// =========================================================
// READY
// =========================================================

console.log(
    "Unified Dashboard Dataset Sync ready."
);