// =========================================================
// EXCEL AI AUTOMATION
// KPI DASHBOARD
// DATASET-AWARE + DASHBOARD-SYNC COMPATIBLE
// =========================================================

console.log("kpi.js loaded.");


let currentKPIData = null;
let currentKPICategory = "All";
let currentSelectedFileId = null;
let kpiFiles = [];


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", async function () {

    console.log("KPI Dashboard JS initialized.");

    initializeKPICategoryFilters();
    initializeKPIFileSelector();
    initializeKPIRefreshButton();

    await initializeKPIDashboard();

});


// =========================================================
// AUTH TOKEN
// =========================================================

function getKPIToken() {

    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token")
    );

}


// =========================================================
// INITIALIZE KPI DASHBOARD
// =========================================================

async function initializeKPIDashboard() {

    const container =
        document.getElementById("kpiContainer");

    if (!container) {

        console.warn(
            "KPI container not found."
        );

        return;
    }


    const token =
        getKPIToken();

    if (!token) {

        showKPIMessage(
            "Please login again to continue.",
            "warning"
        );

        return;
    }


    try {

        // -----------------------------------------------------
        // IMPORTANT:
        // ALWAYS LOAD FRESH FILE LIST
        // -----------------------------------------------------

        const files =
            await loadKPIFileList(token);


        if (!files.length) {

            currentSelectedFileId = null;

            localStorage.removeItem(
                "selected_file_id"
            );

            showKPIMessage(
                "No uploaded datasets found. Please upload an Excel or CSV file first.",
                "info"
            );

            return;
        }


        // -----------------------------------------------------
        // FIND CURRENT DATASET
        // -----------------------------------------------------

        const storedFileId =
            localStorage.getItem(
                "selected_file_id"
            );


        let selectedFile =
            null;


        if (storedFileId) {

            selectedFile =
                files.find(
                    function (file) {

                        return String(
                            getFileIdFromObject(file)
                        ) === String(
                            storedFileId
                        );

                    }
                );

        }


        // -----------------------------------------------------
        // IF STORED FILE DOES NOT EXIST
        // USE NEWEST DATASET
        // -----------------------------------------------------

        if (!selectedFile) {

            selectedFile =
                files[0];

        }


        const selectedId =
            getFileIdFromObject(
                selectedFile
            );


        if (!selectedId) {

            showKPIMessage(
                "Unable to determine selected dataset.",
                "danger"
            );

            return;
        }


        // -----------------------------------------------------
        // SET CURRENT DATASET
        // -----------------------------------------------------

        currentSelectedFileId =
            String(selectedId);


        localStorage.setItem(
            "selected_file_id",
            String(selectedId)
        );


        // -----------------------------------------------------
        // UPDATE SELECTOR
        // -----------------------------------------------------

        updateKPISelectorValue(
            selectedId
        );


        // -----------------------------------------------------
        // LOAD KPIs
        // -----------------------------------------------------

        await loadKPIs(
            selectedId
        );


    }
    catch (error) {

        console.error(
            "KPI initialization error:",
            error
        );


        showKPIMessage(
            error.message ||
            "Unable to initialize KPI dashboard.",
            "danger"
        );

    }

}


// =========================================================
// LOAD FILE LIST
// =========================================================

async function loadKPIFileList(token) {

    const response =
        await fetch(
            "/api/files",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    // -----------------------------------------------------
    // SESSION EXPIRED
    // -----------------------------------------------------

    if (response.status === 401) {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "selected_file_id"
        );

        window.location.href =
            "/login";

        return [];
    }


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Unable to load uploaded files."
        );

    }


    if (
        !data ||
        !Array.isArray(data.files)
    ) {

        throw new Error(
            "Invalid file list received from server."
        );

    }


    // -----------------------------------------------------
    // STORE FILE LIST
    // -----------------------------------------------------

    kpiFiles =
        data.files;


    console.log(
        "KPI uploaded datasets:",
        kpiFiles
    );


    // -----------------------------------------------------
    // POPULATE SELECTOR
    // -----------------------------------------------------

    populateKPIFileSelector(
        kpiFiles
    );


    return kpiFiles;

}


// =========================================================
// GET FILE ID FROM API OBJECT
// =========================================================

function getFileIdFromObject(file) {

    if (!file) {
        return null;
    }


    return (
        file.id ??
        file.file_id ??
        file.fileId ??
        null
    );

}


// =========================================================
// GET FILE NAME
// =========================================================

function getFileNameFromObject(file) {

    if (!file) {
        return "Dataset";
    }


    return (
        file.filename ||
        file.file_name ||
        file.name ||
        "Dataset"
    );

}


// =========================================================
// POPULATE KPI FILE SELECTOR
// =========================================================

function populateKPIFileSelector(files) {

    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (!selector) {

        console.warn(
            "kpiFileSelector not found."
        );

        return;
    }


    selector.innerHTML = "";


    // -----------------------------------------------------
    // DEFAULT OPTION
    // -----------------------------------------------------

    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value = "";

    defaultOption.textContent =
        "Select uploaded file...";


    selector.appendChild(
        defaultOption
    );


    if (
        !Array.isArray(files) ||
        files.length === 0
    ) {

        return;
    }


    // -----------------------------------------------------
    // SORT NEWEST FIRST
    // -----------------------------------------------------

    const sortedFiles =
        [...files].sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.uploaded_at ||
                        a.created_at ||
                        0
                    ).getTime();


                const dateB =
                    new Date(
                        b.uploaded_at ||
                        b.created_at ||
                        0
                    ).getTime();


                return dateB - dateA;

            }
        );


    // -----------------------------------------------------
    // CREATE OPTIONS
    // -----------------------------------------------------

    sortedFiles.forEach(
        function (file) {

            const fileId =
                getFileIdFromObject(
                    file
                );


            if (
                fileId === null ||
                fileId === undefined
            ) {

                return;
            }


            const fileName =
                getFileNameFromObject(
                    file
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(fileId);


            option.textContent =
                fileName;


            selector.appendChild(
                option
            );

        }
    );


    // -----------------------------------------------------
    // SELECT CURRENT FILE
    // -----------------------------------------------------

    if (currentSelectedFileId) {

        selector.value =
            String(
                currentSelectedFileId
            );

    }
    else {

        const storedFileId =
            localStorage.getItem(
                "selected_file_id"
            );


        if (storedFileId) {

            selector.value =
                String(
                    storedFileId
                );

        }

    }


    console.log(
        "KPI selector populated:",
        selector.options.length - 1,
        "datasets"
    );

}


// =========================================================
// UPDATE SELECTOR VALUE
// =========================================================

function updateKPISelectorValue(fileId) {

    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (!selector) {
        return;
    }


    selector.value =
        String(fileId);

}


// =========================================================
// GET CURRENT FILE ID
// =========================================================

function getFileId() {

    // -----------------------------------------------------
    // 1. KPI SELECTOR
    // -----------------------------------------------------

    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (
        selector &&
        selector.value
    ) {

        return String(
            selector.value
        );

    }


    // -----------------------------------------------------
    // 2. CENTRAL DASHBOARD SYNC
    // -----------------------------------------------------

    if (
        typeof window.getUnifiedSelectedFileId ===
        "function"
    ) {

        const unifiedId =
            window.getUnifiedSelectedFileId();


        if (unifiedId) {

            return String(
                unifiedId
            );

        }

    }


    // -----------------------------------------------------
    // 3. LOCAL STORAGE
    // -----------------------------------------------------

    const storedFileId =
        localStorage.getItem(
            "selected_file_id"
        );


    if (storedFileId) {

        return String(
            storedFileId
        );

    }


    // -----------------------------------------------------
    // 4. URL
    // -----------------------------------------------------

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlFileId =
        params.get(
            "file_id"
        );


    if (urlFileId) {

        return String(
            urlFileId
        );

    }


    return null;

}


// =========================================================
// SET SELECTED FILE
// =========================================================

async function setSelectedFile(
    fileId,
    options = {}
) {

    if (
        fileId === null ||
        fileId === undefined ||
        fileId === ""
    ) {

        console.warn(
            "Invalid KPI file ID."
        );

        return;

    }


    fileId =
        String(fileId);


    currentSelectedFileId =
        fileId;


    currentKPICategory =
        "All";


    localStorage.setItem(
        "selected_file_id",
        fileId
    );


    localStorage.setItem(
        "selected_kpi_category",
        "All"
    );


    // -----------------------------------------------------
    // UPDATE SELECTOR
    // -----------------------------------------------------

    updateKPISelectorValue(
        fileId
    );


    // -----------------------------------------------------
    // UNIFIED DASHBOARD SYNC
    // -----------------------------------------------------

    if (
        typeof window.setUnifiedDataset ===
        "function" &&
        options.skipSync !== true
    ) {

        window.setUnifiedDataset(
            fileId,
            {
                source:
                    options.source ||
                    "kpiFileSelector"
            }
        );

        return;

    }


    // -----------------------------------------------------
    // DIRECT LOAD FALLBACK
    // -----------------------------------------------------

    await loadKPIs(
        fileId
    );

}


// =========================================================
// LOAD KPIs
// =========================================================

async function loadKPIs(
    fileId
) {

    const container =
        document.getElementById(
            "kpiContainer"
        );


    if (!container) {

        console.warn(
            "KPI container not found."
        );

        return;

    }


    if (
        fileId === null ||
        fileId === undefined ||
        fileId === ""
    ) {

        showKPIMessage(
            "Please select a dataset first.",
            "warning"
        );

        return;

    }


    fileId =
        String(fileId);


    currentSelectedFileId =
        fileId;


    // -----------------------------------------------------
    // SAVE CENTRAL FILE ID
    // -----------------------------------------------------

    localStorage.setItem(
        "selected_file_id",
        fileId
    );


    // -----------------------------------------------------
    // UPDATE SELECTOR
    // -----------------------------------------------------

    updateKPISelectorValue(
        fileId
    );


    try {

        showKPILoading();


        const token =
            getKPIToken();


        if (!token) {

            showKPIMessage(
                "Your login session is missing or expired.",
                "danger"
            );

            return;

        }


        console.log(
            "Loading KPIs for dataset:",
            fileId
        );


        const response =
            await fetch(
                `/api/kpis/${encodeURIComponent(fileId)}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    },

                    cache: "no-store"
                }
            );


        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "selected_file_id"
            );

            window.location.href =
                "/login";

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load KPIs."
            );

        }


        if (
            !data ||
            !Array.isArray(data.kpis)
        ) {

            throw new Error(
                "Invalid KPI response received."
            );

        }


        // -------------------------------------------------
        // IMPORTANT: UPDATE STATE
        // -------------------------------------------------

        updateKPIState(
            data,
            fileId
        );


        console.log(
            "KPI DATA:",
            currentKPIData
        );


        console.log(
            "Dataset ID:",
            fileId
        );


        console.log(
            "KPI count:",
            data.kpis.length
        );


        console.table(
            data.kpis.map(
                function (kpi) {

                    return {
                        name:
                            kpi.name,

                        category:
                            kpi.category,

                        value:
                            kpi.value
                    };

                }
            )
        );


        // -------------------------------------------------
        // RENDER
        // -------------------------------------------------

        renderKPIs(
            data
        );


    }
    catch (error) {

        console.error(
            "KPI Error:",
            error
        );


        showKPIMessage(
            error.message ||
            "Unable to load KPI data.",
            "danger"
        );

    }

}


// =========================================================
// UPDATE KPI STATE
// =========================================================

function updateKPIState(
    data,
    fileId
) {

    currentKPIData =
        data;


    currentSelectedFileId =
        String(
            fileId ||
            data.file_id ||
            currentSelectedFileId
        );


    localStorage.setItem(
        "selected_file_id",
        currentSelectedFileId
    );


    currentKPICategory =
        "All";


    localStorage.setItem(
        "selected_kpi_category",
        "All"
    );


    updateActiveCategory(
        "All"
    );


    updateKPISelectorValue(
        currentSelectedFileId
    );

}


// =========================================================
// LOADING STATE
// =========================================================

function showKPILoading() {

    const container =
        document.getElementById(
            "kpiContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="col-12">
            <div class="kpi-loading text-center p-5">

                <div
                    class="spinner-border"
                    role="status"
                ></div>

                <p class="mt-3 mb-0">
                    Generating intelligent KPIs...
                </p>

            </div>
        </div>
    `;

}


// =========================================================
// RENDER KPIs
// =========================================================

function renderKPIs(
    data
) {

    const container =
        document.getElementById(
            "kpiContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!data) {

        showKPIMessage(
            "No KPI response received.",
            "danger"
        );

        return;

    }


    const kpis =
        Array.isArray(
            data.kpis
        )
            ? data.kpis
            : [];


    console.log(
        "Rendering KPI count:",
        kpis.length
    );


    if (
        kpis.length === 0
    ) {

        showKPIMessage(
            "No suitable KPIs were detected for this dataset.",
            "info"
        );


        updateKPISummary(
            data,
            0
        );


        return;

    }


    const filteredKPIs =
        filterKPIs(
            kpis,
            currentKPICategory
        );


    console.log(
        "Current KPI category:",
        currentKPICategory
    );


    console.log(
        "Filtered KPI count:",
        filteredKPIs.length
    );


    if (
        filteredKPIs.length === 0
    ) {

        showKPIMessage(
            `No ${currentKPICategory} KPIs are available for this dataset.`,
            "info"
        );


        updateKPISummary(
            data,
            0
        );


        return;

    }


    filteredKPIs.forEach(
        function (kpi, index) {

            const card =
                createKPICard(
                    kpi,
                    index
                );


            container.appendChild(
                card
            );

        }
    );


    updateKPISummary(
        data,
        filteredKPIs.length
    );


    console.log(
        "KPI cards rendered successfully:",
        filteredKPIs.length
    );

}


// =========================================================
// FILTER KPIs
// =========================================================

function filterKPIs(
    kpis,
    category
) {

    if (
        !Array.isArray(kpis)
    ) {

        return [];

    }


    if (
        !category ||
        category === "All"
    ) {

        return kpis;

    }


    const selectedCategory =
        normalizeCategory(
            category
        );


    return kpis.filter(
        function (kpi) {

            const kpiCategory =
                normalizeCategory(
                    kpi.category
                );


            return (
                kpiCategory ===
                selectedCategory
            );

        }
    );

}


// =========================================================
// NORMALIZE CATEGORY
// =========================================================

function normalizeCategory(
    category
) {

    const value =
        String(
            category || ""
        )
            .trim()
            .toLowerCase();


    if (
        value === "sales" ||
        value.includes("sales") ||
        value.includes("sale") ||
        value.includes("revenue")
    ) {

        return "sales";

    }


    if (
        value === "customer" ||
        value.includes("customer") ||
        value.includes("client")
    ) {

        return "customer";

    }


    if (
        value === "finance" ||
        value === "financial" ||
        value.includes("finance") ||
        value.includes("financial") ||
        value.includes("profit") ||
        value.includes("expense") ||
        value.includes("cost")
    ) {

        return "finance";

    }


    if (
        value === "general" ||
        value === "dataset" ||
        value === "numeric" ||
        value === "category" ||
        value === "analytics"
    ) {

        return "general";

    }


    return value;

}


// =========================================================
// CATEGORY FILTERS
// =========================================================

function initializeKPICategoryFilters() {

    const filterContainer =
        document.getElementById(
            "kpiCategoryFilters"
        );


    if (!filterContainer) {
        return;
    }


    const buttons =
        filterContainer.querySelectorAll(
            "[data-kpi-category]"
        );


    buttons.forEach(
        function (button) {

            if (
                button.dataset.kpiAttached ===
                "true"
            ) {

                return;

            }


            button.dataset.kpiAttached =
                "true";


            button.addEventListener(
                "click",
                function () {

                    const category =
                        button.getAttribute(
                            "data-kpi-category"
                        ) ||
                        "All";


                    currentKPICategory =
                        category;


                    localStorage.setItem(
                        "selected_kpi_category",
                        category
                    );


                    updateActiveCategory(
                        category
                    );


                    if (
                        currentKPIData
                    ) {

                        renderKPIs(
                            currentKPIData
                        );

                    }

                }
            );

        }
    );

}


// =========================================================
// ACTIVE CATEGORY
// =========================================================

function updateActiveCategory(
    category
) {

    const filterContainer =
        document.getElementById(
            "kpiCategoryFilters"
        );


    if (!filterContainer) {
        return;
    }


    const buttons =
        filterContainer.querySelectorAll(
            "[data-kpi-category]"
        );


    buttons.forEach(
        function (button) {

            const buttonCategory =
                button.getAttribute(
                    "data-kpi-category"
                );


            if (
                normalizeCategory(
                    buttonCategory
                ) ===
                normalizeCategory(
                    category
                )
            ) {

                button.classList.add(
                    "active"
                );

            }
            else {

                button.classList.remove(
                    "active"
                );

            }

        }
    );

}


// =========================================================
// CREATE KPI CARD
// =========================================================

function createKPICard(
    kpi,
    index
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4";


    const icon =
        getKPIIcon(
            kpi.name
        );


    const category =
        kpi.category ||
        "General";


    const formattedValue =
        kpi.formatted_value ||
        formatKPIValue(
            kpi.value,
            kpi.unit,
            kpi.name
        );


    const insight =
        getKPIInsight(
            kpi
        );


    card.innerHTML = `
        <div class="kpi-card">

            <div class="kpi-card-top">

                <div class="kpi-icon">
                    ${icon}
                </div>

                <span class="kpi-category">
                    ${escapeHTML(category)}
                </span>

            </div>


            <div class="kpi-card-body">

                <div class="kpi-value">
                    ${escapeHTML(formattedValue)}
                </div>


                <div class="kpi-name">
                    ${escapeHTML(
                        kpi.name ||
                        "KPI"
                    )}
                </div>


                <div class="kpi-insight">

                    <span class="kpi-insight-icon">
                        ${insight.icon}
                    </span>

                    <span>
                        ${escapeHTML(
                            insight.text
                        )}
                    </span>

                </div>


                ${
                    kpi.description
                        ? `
                            <div class="kpi-description">
                                ${escapeHTML(
                                    kpi.description
                                )}
                            </div>
                          `
                        : ""
                }

            </div>

        </div>
    `;


    return card;

}


// =========================================================
// KPI VALUE FORMATTER
// =========================================================

function formatKPIValue(
    value,
    unit,
    name
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "N/A";

    }


    if (
        typeof value === "string"
    ) {

        return value;

    }


    const numericValue =
        Number(value);


    if (
        Number.isNaN(
            numericValue
        )
    ) {

        return String(
            value
        );

    }


    const lowerName =
        String(
            name || ""
        )
            .toLowerCase();


    const formatted =
        numericValue.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );


    // Percentage

    if (
        unit === "%" ||
        lowerName.includes("margin") ||
        lowerName.includes("percentage") ||
        lowerName.includes("rate")
    ) {

        return `${formatted}%`;

    }


    // Currency

    if (
        unit === "currency" ||
        lowerName.includes("sales") ||
        lowerName.includes("revenue") ||
        lowerName.includes("profit") ||
        lowerName.includes("expense") ||
        lowerName.includes("cost") ||
        lowerName.includes("income") ||
        lowerName.includes("amount") ||
        lowerName.includes("price") ||
        lowerName.includes("value")
    ) {

        return `₹${formatted}`;

    }


    return formatted;

}


// =========================================================
// KPI ICON
// =========================================================

function getKPIIcon(
    name
) {

    const kpiName =
        String(
            name || ""
        )
            .toLowerCase();


    if (
        kpiName.includes("sales") ||
        kpiName.includes("revenue")
    ) {

        return "💰";

    }


    if (
        kpiName.includes("profit")
    ) {

        return "📈";

    }


    if (
        kpiName.includes("customer")
    ) {

        return "👥";

    }


    if (
        kpiName.includes("order")
    ) {

        return "🛒";

    }


    if (
        kpiName.includes("record")
    ) {

        return "📊";

    }


    if (
        kpiName.includes("average")
    ) {

        return "📐";

    }


    if (
        kpiName.includes("expense") ||
        kpiName.includes("cost")
    ) {

        return "💳";

    }


    if (
        kpiName.includes("growth")
    ) {

        return "🚀";

    }


    if (
        kpiName.includes("price")
    ) {

        return "💹";

    }


    return "📊";

}


// =========================================================
// KPI INSIGHT
// =========================================================

function getKPIInsight(
    kpi
) {

    const name =
        String(
            kpi.name || ""
        )
            .toLowerCase();


    if (
        name.includes("total")
    ) {

        return {
            icon: "📊",
            text: "Overall dataset total"
        };

    }


    if (
        name.includes("average")
    ) {

        return {
            icon: "📐",
            text: "Average dataset value"
        };

    }


    if (
        name.includes("maximum")
    ) {

        return {
            icon: "⬆️",
            text: "Highest observed value"
        };

    }


    if (
        name.includes("minimum")
    ) {

        return {
            icon: "⬇️",
            text: "Lowest observed value"
        };

    }


    if (
        name.includes("customer")
    ) {

        return {
            icon: "👥",
            text: "Customer metric"
        };

    }


    if (
        name.includes("order")
    ) {

        return {
            icon: "🛒",
            text: "Order metric"
        };

    }


    if (
        name.includes("margin")
    ) {

        return {
            icon: "📈",
            text: "Financial performance"
        };

    }


    return {
        icon: "💡",
        text: "Dataset insight"
    };

}


// =========================================================
// KPI SUMMARY
// =========================================================

function updateKPISummary(
    data,
    visibleCount
) {

    const totalKPIElement =
        document.getElementById(
            "totalKPI"
        );


    if (totalKPIElement) {

        totalKPIElement.textContent =
            visibleCount !== undefined
                ? visibleCount
                : (
                    data?.total_kpis ||
                    0
                );

    }


    const filenameElement =
        document.getElementById(
            "kpiFileName"
        );


    if (filenameElement) {

        filenameElement.textContent =
            data?.filename ||
            getSelectedFileName() ||
            "Dataset";

    }

}


// =========================================================
// SELECTED FILE NAME
// =========================================================

function getSelectedFileName() {

    if (
        !currentSelectedFileId
    ) {

        return "Dataset";

    }


    const file =
        kpiFiles.find(
            function (item) {

                return String(
                    getFileIdFromObject(
                        item
                    )
                ) ===
                String(
                    currentSelectedFileId
                );

            }
        );


    if (!file) {

        return "Dataset";

    }


    return getFileNameFromObject(
        file
    );

}


// =========================================================
// KPI MESSAGE
// =========================================================

function showKPIMessage(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "kpiContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="col-12">

            <div
                class="alert alert-${type}"
                role="alert"
            >
                ${escapeHTML(message)}
            </div>

        </div>
    `;

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


// =========================================================
// KPI FILE SELECTOR
// =========================================================

function initializeKPIFileSelector() {

    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (!selector) {

        console.warn(
            "KPI file selector not found."
        );

        return;
    }


    if (
        selector.dataset.kpiAttached ===
        "true"
    ) {

        return;

    }


    selector.dataset.kpiAttached =
        "true";


    selector.addEventListener(
        "change",
        async function () {

            const fileId =
                this.value;


            if (!fileId) {

                showKPIMessage(
                    "Please select an uploaded file.",
                    "warning"
                );

                return;

            }


            console.log(
                "KPI dataset selected:",
                fileId
            );


            await setSelectedFile(
                fileId,
                {
                    source:
                        "kpiFileSelector"
                }
            );

        }
    );

}


// =========================================================
// KPI REFRESH BUTTON
// =========================================================

function initializeKPIRefreshButton() {

    const refreshButton =
        document.getElementById(
            "refreshKPIButton"
        );


    if (!refreshButton) {

        return;

    }


    if (
        refreshButton.dataset.kpiAttached ===
        "true"
    ) {

        return;

    }


    refreshButton.dataset.kpiAttached =
        "true";


    refreshButton.addEventListener(
        "click",
        async function () {

            const fileId =
                currentSelectedFileId ||
                getFileId();


            if (!fileId) {

                showKPIMessage(
                    "Please select a dataset first.",
                    "warning"
                );

                return;

            }


            const originalHTML =
                refreshButton.innerHTML;


            refreshButton.disabled =
                true;


            refreshButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Refreshing...
            `;


            try {

                await loadKPIs(
                    fileId
                );

            }
            finally {

                refreshButton.disabled =
                    false;


                refreshButton.innerHTML =
                    originalHTML;

            }

        }
    );

}


// =========================================================
// DASHBOARD SYNC EVENT
// =========================================================

window.addEventListener(
    "dashboardDatasetChanged",
    async function (event) {

        const fileId =
            event.detail?.fileId;


        if (!fileId) {
            return;
        }


        console.log(
            "KPI received dashboard dataset change:",
            fileId
        );


        currentSelectedFileId =
            String(fileId);


        updateKPISelectorValue(
            fileId
        );


        await loadKPIs(
            fileId
        );

    }
);


// =========================================================
// GLOBAL FUNCTIONS
// =========================================================

window.loadKPIs =
    loadKPIs;


window.setSelectedFile =
    setSelectedFile;


window.populateKPIFileSelector =
    populateKPIFileSelector;


window.getKPISelectedFileId =
    getFileId;


// =========================================================
// READY
// =========================================================

console.log(
    "KPI module ready."
);