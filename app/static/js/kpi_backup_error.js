// =========================================================
// Excel AI Automation
// KPI Dashboard JavaScript
// Step 8.3.5
// Category Filtering + Professional UX
// =========================================================

let currentKPIData = null;
let currentKPICategory = "All";
let currentSelectedFileId = null;


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "KPI Dashboard JS loaded."
        );

        initializeKPIDashboard();

    }
);


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


    initializeKPICategoryFilters();


    const fileId =
        getFileId();


    if (!fileId) {

        showKPIMessage(
            "Please select an uploaded file first.",
            "warning"
        );

        return;

    }


    currentSelectedFileId =
        fileId;


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

    if (
        fileId === null ||
        fileId === undefined ||
        fileId === ""
    ) {

        return;

    }


    currentSelectedFileId =
        String(fileId);


    localStorage.setItem(
        "selected_file_id",
        String(fileId)
    );


    console.log(
        "KPI file selected:",
        fileId
    );


    // Reset category filter
    currentKPICategory =
        "All";


    updateActiveCategory(
        "All"
    );


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


        if (!token) {

            showKPIMessage(
                "Please login again to continue.",
                "danger"
            );

            return;

        }


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


       currentKPIData = data;

console.log(
    "KPI DATA:",
    currentKPIData
);

console.table(
    currentKPIData.kpis.map(function (kpi) {
        return {
            name: kpi.name,
            category: kpi.category,
            value: kpi.value
        };
    })
);

renderKPIs(data);
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

        updateKPISummary(
            data
        );

        return;

    }


    // ---------------------------------------------
    // Filter
    // ---------------------------------------------

    const filteredKPIs =
        filterKPIs(
            data.kpis,
            currentKPICategory
        );


    // ---------------------------------------------
    // Empty category
    // ---------------------------------------------

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


    // ---------------------------------------------
    // Render cards
    // ---------------------------------------------

    filteredKPIs.forEach(
        function (
            kpi,
            index
        ) {

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

}


// =========================================================
// FILTER KPIs
// =========================================================

function filterKPIs(kpis, category) {

    if (category === "All") {
        return kpis;
    }

    return kpis.filter(function (kpi) {

        const kpiCategory =
            normalizeCategory(kpi.category);

        const selectedCategory =
            normalizeCategory(category);

        return kpiCategory === selectedCategory;
    });
}


// =========================================================
// NORMALIZE CATEGORY
// =========================================================
function normalizeCategory(category) {

    const value = String(
        category || ""
    )
    .trim()
    .toLowerCase();

    // Sales
    if (
        value.includes("sales") ||
        value.includes("sale") ||
        value.includes("revenue")
    ) {
        return "sales";
    }

    // Customer
    if (
        value.includes("customer") ||
        value.includes("client")
    ) {
        return "customer";
    }

    // Finance
    if (
        value.includes("financial") ||
        value.includes("finance") ||
        value.includes("profit") ||
        value.includes("expense")
    ) {
        return "finance";
    }

    // General
    if (
        value.includes("dataset") ||
        value.includes("numeric") ||
        value.includes("category") ||
        value.includes("analytics") ||
        value.includes("general")
    ) {
        return "general";
    }

    return value;
}


    if (
        value === "dataset" ||
        value === "numeric" ||
        value === "analytics" ||
        value === "general"
    ) {

        return "general";

    }


    if (
        value === "customer"
    ) {

        return "customer";

    }


    if (
        value === "sales"
    ) {

        return "sales";

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

        console.log(
            "KPI category filter container not found."
        );

        return;

    }


    const buttons =
        filterContainer.querySelectorAll(
            "[data-kpi-category]"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const category =
                        button.getAttribute(
                            "data-kpi-category"
                        );


                    currentKPICategory =
                        category ||
                        "All";


                    updateActiveCategory(
                        currentKPICategory
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

            } else {

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
        formatKPIValue(
            kpi.value,
            kpi.unit,
            kpi.name
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
                    ${formattedValue}
                </div>

                <div class="kpi-name">
                    ${escapeHTML(
                        kpi.name ||
                        "KPI"
                    )}
                </div>

                ${
                    kpi.description
                    ?
                    `
                    <div class="kpi-description">
                        ${escapeHTML(
                            kpi.description
                        )}
                    </div>
                    `
                    :
                    ""
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


    // ---------------------------------------------
    // Percentage
    // ---------------------------------------------

    if (
        unit === "%" ||
        lowerName.includes(
            "margin"
        ) ||
        lowerName.includes(
            "percentage"
        )
    ) {

        return `${formatted}%`;

    }


    // ---------------------------------------------
    // Currency
    // ---------------------------------------------

    if (
        unit === "currency" ||
        lowerName.includes("sales") ||
        lowerName.includes("revenue") ||
        lowerName.includes("profit") ||
        lowerName.includes("expense") ||
        lowerName.includes("cost") ||
        lowerName.includes("income") ||
        lowerName.includes("amount") ||
        lowerName.includes("price")
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


    return "📊";

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
            visibleCount ??
            data.total_kpis ??
            data.kpis.length ??
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
// MESSAGE
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

                ${escapeHTML(
                    message
                )}

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
        String(value);


    return div.innerHTML;

}