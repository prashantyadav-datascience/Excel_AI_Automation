// =========================================================
// Excel AI Automation
// KPI Dashboard JavaScript
// Step 8.3.2
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("KPI Dashboard JS loaded.");

    initializeKPIDashboard();

});


// =========================================================
// KPI STATE
// =========================================================

let currentKPIData = null;

let currentKPIFilter = "All";


// =========================================================
// INITIALIZE KPI DASHBOARD
// =========================================================

async function initializeKPIDashboard() {

    const kpiContainer =
        document.getElementById(
            "kpiContainer"
        );

    if (!kpiContainer) {

        console.log(
            "KPI container not found."
        );

        return;
    }


    const fileId =
        getFileId();


    if (!fileId) {

        showKPIMessage(
            "Please select an uploaded file first.",
            "warning"
        );

        return;
    }


    await loadKPIs(
        fileId
    );

}


// =========================================================
// GET FILE ID
// =========================================================

function getFileId() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const urlFileId =
        urlParams.get(
            "file_id"
        );


    if (urlFileId) {

        return urlFileId;

    }


    const storedFileId =
        localStorage.getItem(
            "selected_file_id"
        );


    if (storedFileId) {

        return storedFileId;

    }


    return null;

}


// =========================================================
// SET SELECTED FILE
// =========================================================

function setSelectedFile(
    fileId
) {

    if (!fileId) {

        console.warn(
            "Invalid file ID."
        );

        return;

    }


    localStorage.setItem(
        "selected_file_id",
        fileId
    );


    // Update URL without full page reload

    const url =
        new URL(
            window.location.href
        );


    url.searchParams.set(
        "file_id",
        fileId
    );


    window.history.replaceState(
        {},
        "",
        url
    );


    // Refresh KPIs

    loadKPIs(
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

        return;

    }


    try {

        showKPILoading();


        const token =
            localStorage.getItem(
                "access_token"
            );


        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!token) {

            showKPIMessage(
                "Please login again to continue.",
                "danger"
            );

            return;

        }


        // -------------------------------------------------
        // API Request
        // -------------------------------------------------

        const response =
            await fetch(
                `/api/kpis/${fileId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load KPIs."
            );

        }


        if (
            !data.success ||
            !Array.isArray(
                data.kpis
            )
        ) {

            throw new Error(
                "Invalid KPI response received."
            );

        }


        // -------------------------------------------------
        // Save current KPI data
        // -------------------------------------------------

        currentKPIData =
            data;


        currentKPIFilter =
            "All";


        // -------------------------------------------------
        // Render
        // -------------------------------------------------

        renderKPIInterface(
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
// RENDER COMPLETE KPI INTERFACE
// =========================================================

function renderKPIInterface(
    data
) {

    renderKPIFilters(
        data
    );


    renderKPIs(
        data
    );


    updateKPISummary(
        data
    );

}


// =========================================================
// KPI CATEGORY FILTERS
// =========================================================

function renderKPIFilters(
    data
) {

    const filterContainer =
        document.getElementById(
            "kpiFilters"
        );


    if (!filterContainer) {

        console.log(
            "KPI filter container not found."
        );

        return;

    }


    const categories = [
        "All",
        "Sales",
        "Customer",
        "Finance",
        "General"
    ];


    filterContainer.innerHTML =
        categories.map(
            function (category) {

                const activeClass =
                    category ===
                    currentKPIFilter
                        ? "active"
                        : "";


                return `

                    <button
                        type="button"
                        class="kpi-filter-btn ${activeClass}"
                        data-category="${escapeHTML(category)}"
                        onclick="filterKPIs('${category}')"
                    >

                        ${escapeHTML(category)}

                    </button>

                `;

            }
        ).join("");

}


// =========================================================
// FILTER KPIs
// =========================================================

function filterKPIs(
    category
) {

    if (!currentKPIData) {

        return;

    }


    currentKPIFilter =
        category;


    renderKPIFilters(
        currentKPIData
    );


    renderKPIs(
        currentKPIData
    );

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


    container.innerHTML = "";


    if (
        !data.kpis ||
        data.kpis.length === 0
    ) {

        showKPIMessage(
            "No suitable KPIs were detected for this dataset.",
            "info"
        );

        return;

    }


    let filteredKPIs =
        data.kpis;


    // -----------------------------------------------------
    // Apply category filter
    // -----------------------------------------------------

    if (
        currentKPIFilter !==
        "All"
    ) {

        filteredKPIs =
            data.kpis.filter(
                function (kpi) {

                    return (
                        String(
                            kpi.category ||
                            "General"
                        ).toLowerCase()
                        ===
                        currentKPIFilter.toLowerCase()
                    );

                }
            );

    }


    // -----------------------------------------------------
    // No results
    // -----------------------------------------------------

    if (
        filteredKPIs.length === 0
    ) {

        showKPIMessage(
            `No ${currentKPIFilter} KPIs available for this dataset.`,
            "info"
        );

        return;

    }


    // -----------------------------------------------------
    // Create cards
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // IMPORTANT:
    // Prefer backend formatted_value
    // -----------------------------------------------------

    const formattedValue =
        kpi.formatted_value ||
        formatKPIValue(
            kpi.value,
            kpi.unit
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
// FORMAT KPI VALUE
// =========================================================

function formatKPIValue(
    value,
    unit
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

        return escapeHTML(
            value
        );

    }


    const numericValue =
        Number(value);


    if (
        Number.isNaN(
            numericValue
        )
    ) {

        return escapeHTML(
            String(value)
        );

    }


    const formatted =
        numericValue.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );


    if (
        unit === "%"
    ) {

        return `${formatted}%`;

    }


    if (
        unit === "currency"
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
        ).toLowerCase();


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
        kpiName.includes("margin")
    ) {

        return "📊";

    }


    return "📊";

}


// =========================================================
// UPDATE KPI SUMMARY
// =========================================================

function updateKPISummary(
    data
) {

    const totalKPIElement =
        document.getElementById(
            "totalKPI"
        );


    if (totalKPIElement) {

        totalKPIElement.textContent =
            data.total_kpis ||
            data.kpis.length ||
            0;

    }


    const filenameElement =
        document.getElementById(
            "kpiFileName"
        );


    if (filenameElement) {

        filenameElement.textContent =
            data.filename ||
            "Dataset";

    }

}


// =========================================================
// SHOW LOADING
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

            <div class="kpi-loading">

                <div
                    class="spinner-border"
                    role="status"
                ></div>

                <p>
                    Generating intelligent KPIs...
                </p>

            </div>

        </div>

    `;

}


// =========================================================
// SHOW MESSAGE
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
                class="alert alert-${escapeHTML(type)}"
                role="alert"
            >

                ${escapeHTML(message)}

            </div>

        </div>

    `;

}


// =========================================================
// REFRESH CURRENT KPI FILE
// =========================================================

function refreshKPIs() {

    const fileId =
        getFileId();


    if (!fileId) {

        showKPIMessage(
            "Please select an uploaded file first.",
            "warning"
        );

        return;

    }


    loadKPIs(
        fileId
    );

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
        String(value);


    return div.innerHTML;

}