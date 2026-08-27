// =========================================================
// Excel AI Automation
// KPI Dashboard JavaScript
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("KPI Dashboard JS loaded.");

    initializeKPIDashboard();

});


// =========================================================
// INITIALIZE KPI DASHBOARD
// =========================================================

async function initializeKPIDashboard() {

    const kpiContainer = document.getElementById(
        "kpiContainer"
    );

    if (!kpiContainer) {
        console.log("KPI container not found.");
        return;
    }

    // -----------------------------------------------------
    // Get file ID
    // -----------------------------------------------------

    const fileId = getFileId();

    if (!fileId) {

        showKPIMessage(
            "Please select an uploaded file first.",
            "warning"
        );

        return;
    }

    // -----------------------------------------------------
    // Load KPIs
    // -----------------------------------------------------

    await loadKPIs(fileId);

}


// =========================================================
// GET FILE ID
// =========================================================

function getFileId() {

    // URL example:
    // /dashboard?file_id=1

    const urlParams = new URLSearchParams(
        window.location.search
    );

    const urlFileId = urlParams.get(
        "file_id"
    );

    if (urlFileId) {

        return urlFileId;

    }


    // localStorage fallback

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
// LOAD KPIs
// =========================================================

async function loadKPIs(fileId) {

    const container =
        document.getElementById(
            "kpiContainer"
        );

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


        const response = await fetch(
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
            !Array.isArray(data.kpis)
        ) {

            throw new Error(
                "Invalid KPI response received."
            );

        }


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

        <div class="kpi-loading">

            <div
                class="spinner-border"
                role="status"
            ></div>

            <p>
                Generating intelligent KPIs...
            </p>

        </div>

    `;

}


// =========================================================
// RENDER KPIs
// =========================================================

function renderKPIs(data) {

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


    data.kpis.forEach(
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


    // -----------------------------------------------------
    // Update KPI summary
    // -----------------------------------------------------

    updateKPISummary(data);

}


// =========================================================
// CREATE KPI CARD
// =========================================================

function createKPICard(kpi, index) {

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
        "Analytics";


    const formattedValue =
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
                    ${formattedValue}
                </div>

                <div class="kpi-name">
                    ${escapeHTML(
                        kpi.name ||
                        "KPI"
                    )}
                </div>

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


    let formatted;


    if (
        Math.abs(
            numericValue
        ) >= 10000000
    ) {

        formatted =
            numericValue.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }

    else {

        formatted =
            numericValue.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


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


    return "📊";

}


// =========================================================
// UPDATE KPI SUMMARY
// =========================================================

function updateKPISummary(data) {

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

                ${escapeHTML(message)}

            </div>

        </div>

    `;

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;

}