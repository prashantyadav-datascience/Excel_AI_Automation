// =========================================================
// EXCEL AI AUTOMATION
// STEP 5.2 - INTERACTIVE DATA VISUALIZATION
// =========================================================

console.log("visualization.js loaded.");


// =========================================================
// GLOBAL STATE
// =========================================================

let visualizationCharts = {
    bar: null,
    line: null,
    donut: null,
    distribution: null
};

let currentVisualizationData = null;


// =========================================================
// AUTH TOKEN
// =========================================================

function getVisualizationToken() {

    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token")
    );
}


// =========================================================
// SELECTED FILE
// =========================================================

function getSelectedVisualizationFileId() {

    // -----------------------------------------------------
    // Unified dashboard selection
    // -----------------------------------------------------

    if (
        typeof window.getUnifiedSelectedFileId ===
        "function"
    ) {

        const unifiedId =
            window.getUnifiedSelectedFileId();

        if (unifiedId) {
            return String(unifiedId);
        }
    }


    // -----------------------------------------------------
    // Local storage fallback
    // -----------------------------------------------------

    const storedId =
        localStorage.getItem(
            "selected_file_id"
        );

    if (storedId) {
        return String(storedId);
    }


    return null;
}


// =========================================================
// UI HELPERS
// =========================================================

function showVisualizationLoading() {

    document
        .getElementById("visualizationLoading")
        ?.classList.remove("d-none");

    document
        .getElementById("visualizationError")
        ?.classList.add("d-none");

}


function hideVisualizationLoading() {

    document
        .getElementById("visualizationLoading")
        ?.classList.add("d-none");

}


function showVisualizationError(message) {

    const element =
        document.getElementById(
            "visualizationError"
        );

    if (!element) return;

    element.textContent =
        message ||
        "Unable to generate visualizations.";

    element.classList.remove(
        "d-none"
    );
}


function showVisualizationEmpty() {

    document
        .getElementById("visualizationEmpty")
        ?.classList.remove("d-none");

    document
        .getElementById("visualizationContent")
        ?.classList.add("d-none");
}


function showVisualizationContent() {

    document
        .getElementById("visualizationEmpty")
        ?.classList.add("d-none");

    document
        .getElementById("visualizationContent")
        ?.classList.remove("d-none");
}


// =========================================================
// CHART.JS CHECK
// =========================================================

function isChartJsAvailable() {

    if (
        typeof window.Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not available."
        );

        showVisualizationError(
            "Chart.js could not be loaded. Please refresh the dashboard."
        );

        return false;
    }

    return true;
}


// =========================================================
// DESTROY EXISTING CHARTS
// =========================================================

function destroyVisualizationCharts() {

    Object.keys(
        visualizationCharts
    ).forEach(
        key => {

            const chart =
                visualizationCharts[key];

            if (chart) {

                try {
                    chart.destroy();
                }
                catch (error) {

                    console.warn(
                        "Chart destroy warning:",
                        error
                    );

                }
            }

            visualizationCharts[key] =
                null;
        }
    );
}


// =========================================================
// CLEAR CANVAS
// =========================================================

function clearCanvas(canvasId) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) return;

    const context =
        canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// =========================================================
// FORMAT NUMBER
// =========================================================

function formatVisualizationNumber(
    value
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return "0";
    }

    return number.toLocaleString(
        undefined,
        {
            maximumFractionDigits: 2
        }
    );
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeVisualizationHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================================
// DATA NORMALIZATION
// =========================================================

function normalizeVisualizationData(
    data
) {

    if (!data) {
        return {};
    }

    // -----------------------------------------------------
    // Some APIs return { success: true, data: {...} }
    // -----------------------------------------------------

    if (
        data.data &&
        typeof data.data === "object" &&
        !Array.isArray(data.data)
    ) {

        return data.data;
    }


    return data;
}


// =========================================================
// FIND ARRAY
// =========================================================

function findArray(
    data,
    keys
) {

    for (
        const key of keys
    ) {

        if (
            Array.isArray(data?.[key])
        ) {

            return data[key];
        }
    }

    return [];
}


// =========================================================
// FIND OBJECT
// =========================================================

function findObject(
    data,
    keys
) {

    for (
        const key of keys
    ) {

        if (
            data?.[key] &&
            typeof data[key] === "object" &&
            !Array.isArray(data[key])
        ) {

            return data[key];
        }
    }

    return {};
}


// =========================================================
// LOAD VISUALIZATION DATA
// =========================================================

async function loadVisualizations(
    fileId = null
) {

    if (!fileId) {

        fileId =
            getSelectedVisualizationFileId();
    }


    // -----------------------------------------------------
    // No dataset selected
    // -----------------------------------------------------

    if (!fileId) {

        console.warn(
            "No dataset selected for visualization."
        );

        destroyVisualizationCharts();

        showVisualizationEmpty();

        return;
    }


    showVisualizationLoading();


    try {

        // -------------------------------------------------
        // Chart.js
        // -------------------------------------------------

        if (
            !isChartJsAvailable()
        ) {

            return;
        }


        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        const token =
            getVisualizationToken();


        if (!token) {

            throw new Error(
                "Your login session has expired. Please login again."
            );
        }


        // -------------------------------------------------
        // API request
        // -------------------------------------------------

        const response =
            await fetch(
                `/api/visualization/${encodeURIComponent(fileId)}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        // -------------------------------------------------
        // Response parsing
        // -------------------------------------------------

        let data = null;

        try {

            data =
                await response.json();

        }
        catch {

            throw new Error(
                "Server returned an invalid visualization response."
            );
        }


        // -------------------------------------------------
        // HTTP error
        // -------------------------------------------------

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                data?.message ||
                "Unable to load visualization data."
            );
        }


        // -------------------------------------------------
        // API success flag
        // -------------------------------------------------

        if (
            data?.success === false
        ) {

            throw new Error(
                data?.detail ||
                data?.message ||
                "Visualization generation failed."
            );
        }


        // -------------------------------------------------
        // Normalize
        // -------------------------------------------------

        const normalizedData =
            normalizeVisualizationData(
                data
            );


        currentVisualizationData =
            normalizedData;


        // -------------------------------------------------
        // Render
        // -------------------------------------------------

        renderVisualizations(
            normalizedData
        );


        console.log(
            "INTERACTIVE VISUALIZATION:",
            normalizedData
        );

    }
    catch (error) {

        console.error(
            "Visualization Error:",
            error
        );


        destroyVisualizationCharts();


        showVisualizationError(
            error.message ||
            "Unable to generate interactive visualizations."
        );

    }
    finally {

        hideVisualizationLoading();

    }
}


// =========================================================
// RENDER ALL VISUALIZATIONS
// =========================================================

function renderVisualizations(
    data
) {

    if (!data) {

        showVisualizationEmpty();

        return;
    }


    showVisualizationContent();


    // -----------------------------------------------------
    // Remove previous charts
    // -----------------------------------------------------

    destroyVisualizationCharts();


    // -----------------------------------------------------
    // Dataset summary
    // -----------------------------------------------------

    renderVisualizationSummary(
        data
    );


    // -----------------------------------------------------
    // Individual visualizations
    // -----------------------------------------------------

    renderBarChart(
        data
    );

    renderLineChart(
        data
    );

    renderDonutChart(
        data
    );

    renderCorrelationVisualization(
        data
    );

    renderDistributionChart(
        data
    );


    // -----------------------------------------------------
    // Check whether anything rendered
    // -----------------------------------------------------

    const hasVisualData =
        hasRenderableVisualizationData(
            data
        );


    if (!hasVisualData) {

        showVisualizationEmpty();

    }

}


// =========================================================
// HAS DATA
// =========================================================

function hasRenderableVisualizationData(
    data
) {

    const barData =
        findArray(
            data,
            [
                "bar_chart",
                "barChart",
                "bar",
                "bar_data"
            ]
        );


    const lineData =
        findArray(
            data,
            [
                "line_chart",
                "lineChart",
                "line",
                "line_data",
                "trend"
            ]
        );


    const donutData =
        findArray(
            data,
            [
                "donut_chart",
                "donutChart",
                "donut",
                "category_distribution",
                "categorical_distribution"
            ]
        );


    const correlationData =
        findArray(
            data,
            [
                "correlations",
                "correlation",
                "strong_correlations"
            ]
        );


    const distributionData =
        findArray(
            data,
            [
                "distribution",
                "distributions",
                "numeric_distribution"
            ]
        );


    return (
        barData.length > 0 ||
        lineData.length > 0 ||
        donutData.length > 0 ||
        correlationData.length > 0 ||
        distributionData.length > 0
    );
}


// =========================================================
// SUMMARY
// =========================================================

function renderVisualizationSummary(
    data
) {

    const summary =
        findObject(
            data,
            [
                "summary",
                "dataset_summary",
                "metadata"
            ]
        );


    const fileName =
        data?.file_name ||
        data?.filename ||
        summary?.file_name ||
        summary?.filename ||
        "Selected Dataset";


    const rows =
        data?.rows ??
        summary?.rows ??
        summary?.row_count ??
        0;


    const columns =
        data?.columns ??
        summary?.columns ??
        summary?.column_count ??
        0;


    const fileElement =
        document.getElementById(
            "visualizationFileName"
        );

    if (fileElement) {

        fileElement.textContent =
            String(fileName);

    }


    const rowsElement =
        document.getElementById(
            "visualizationRows"
        );

    if (rowsElement) {

        rowsElement.textContent =
            Number(rows)
                .toLocaleString();

    }


    const columnsElement =
        document.getElementById(
            "visualizationColumns"
        );

    if (columnsElement) {

        columnsElement.textContent =
            Number(columns)
                .toLocaleString();

    }

}


// =========================================================
// GET CHART DATA
// =========================================================

function getChartArray(
    data,
    type
) {

    if (type === "bar") {

        return findArray(
            data,
            [
                "bar_chart",
                "barChart",
                "bar",
                "bar_data"
            ]
        );
    }


    if (type === "line") {

        return findArray(
            data,
            [
                "line_chart",
                "lineChart",
                "line",
                "line_data",
                "trend",
                "trends"
            ]
        );
    }


    if (type === "donut") {

        return findArray(
            data,
            [
                "donut_chart",
                "donutChart",
                "donut",
                "category_distribution",
                "categorical_distribution"
            ]
        );
    }


    if (type === "distribution") {

        return findArray(
            data,
            [
                "distribution",
                "distributions",
                "numeric_distribution"
            ]
        );
    }


    if (type === "correlation") {

        return findArray(
            data,
            [
                "correlations",
                "correlation",
                "strong_correlations"
            ]
        );
    }


    return [];
}


// =========================================================
// BAR CHART
// =========================================================

function renderBarChart(
    data
) {

    const canvas =
        document.getElementById(
            "barChart"
        );

    const empty =
        document.getElementById(
            "barChartEmpty"
        );


    if (!canvas) return;


    const chartData =
        getChartArray(
            data,
            "bar"
        );


    if (
        !chartData ||
        chartData.length === 0
    ) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    canvas.classList.remove(
        "d-none"
    );

    empty?.classList.add(
        "d-none"
    );


    const labels = [];
    const values = [];


    chartData.forEach(
        item => {

            const label =
                item.label ??
                item.category ??
                item.name ??
                item.column ??
                item.x;


            const value =
                item.value ??
                item.total ??
                item.amount ??
                item.count ??
                item.y;


            if (
                label !== undefined &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                labels.push(
                    String(label)
                );

                values.push(
                    Number(value)
                );
            }

        }
    );


    if (!labels.length) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    visualizationCharts.bar =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Value",

                            data:
                                values,

                            borderWidth:
                                1
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: true
                        },

                        tooltip: {
                            enabled: true
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero:
                                true,

                            ticks: {
                                callback:
                                    value =>
                                        formatVisualizationNumber(
                                            value
                                        )
                            }
                        }
                    }
                }
            }
        );

}


// =========================================================
// LINE CHART
// =========================================================

function renderLineChart(
    data
) {

    const canvas =
        document.getElementById(
            "lineChart"
        );

    const empty =
        document.getElementById(
            "lineChartEmpty"
        );


    if (!canvas) return;


    const chartData =
        getChartArray(
            data,
            "line"
        );


    if (
        !chartData ||
        chartData.length === 0
    ) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    canvas.classList.remove(
        "d-none"
    );

    empty?.classList.add(
        "d-none"
    );


    const labels = [];
    const values = [];


    chartData.forEach(
        item => {

            const label =
                item.label ??
                item.date ??
                item.period ??
                item.x ??
                item.category;


            const value =
                item.value ??
                item.amount ??
                item.total ??
                item.y;


            if (
                label !== undefined &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                labels.push(
                    String(label)
                );

                values.push(
                    Number(value)
                );
            }

        }
    );


    if (!labels.length) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    visualizationCharts.line =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Trend",

                            data:
                                values,

                            tension:
                                0.35,

                            fill:
                                false,

                            pointRadius:
                                4,

                            borderWidth:
                                2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: true
                        },

                        tooltip: {
                            enabled: true
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero:
                                false,

                            ticks: {
                                callback:
                                    value =>
                                        formatVisualizationNumber(
                                            value
                                        )
                            }
                        }
                    }
                }
            }
        );

}


// =========================================================
// DONUT CHART
// =========================================================

function renderDonutChart(
    data
) {

    const canvas =
        document.getElementById(
            "donutChart"
        );

    const empty =
        document.getElementById(
            "donutChartEmpty"
        );


    if (!canvas) return;


    const chartData =
        getChartArray(
            data,
            "donut"
        );


    if (
        !chartData ||
        chartData.length === 0
    ) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    canvas.classList.remove(
        "d-none"
    );

    empty?.classList.add(
        "d-none"
    );


    const labels = [];
    const values = [];


    chartData.forEach(
        item => {

            const label =
                item.label ??
                item.category ??
                item.name ??
                item.x;


            const value =
                item.value ??
                item.count ??
                item.total ??
                item.amount ??
                item.y;


            if (
                label !== undefined &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                labels.push(
                    String(label)
                );

                values.push(
                    Number(value)
                );
            }

        }
    );


    if (!labels.length) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    visualizationCharts.donut =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Distribution",

                            data:
                                values,

                            borderWidth:
                                1
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "62%",

                    plugins: {

                        legend: {
                            position:
                                "right"
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        const value =
                                            context.raw;

                                        return (
                                            " " +
                                            context.label +
                                            ": " +
                                            formatVisualizationNumber(
                                                value
                                            )
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );

}


// =========================================================
// CORRELATION VISUALIZATION
// =========================================================

function renderCorrelationVisualization(
    data
) {

    const container =
        document.getElementById(
            "correlationVisualization"
        );


    if (!container) return;


    const relationships =
        getChartArray(
            data,
            "correlation"
        );


    if (
        !relationships ||
        relationships.length === 0
    ) {

        container.innerHTML = `
            <div class="text-muted">
                No strong correlations detected.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    relationships.forEach(
        relationship => {

            const column1 =
                relationship.column_1 ??
                relationship.column1 ??
                relationship.x ??
                relationship.feature_1 ??
                relationship.feature1 ??
                "Column 1";


            const column2 =
                relationship.column_2 ??
                relationship.column2 ??
                relationship.y ??
                relationship.feature_2 ??
                relationship.feature2 ??
                "Column 2";


            const correlation =
                Number(
                    relationship.correlation ??
                    relationship.value ??
                    relationship.coefficient ??
                    relationship.r
                );


            if (
                !Number.isFinite(
                    correlation
                )
            ) {
                return;
            }


            const absoluteValue =
                Math.abs(
                    correlation
                );


            let strength =
                "Weak";


            if (
                absoluteValue >= 0.8
            ) {

                strength =
                    "Very Strong";

            }
            else if (
                absoluteValue >= 0.6
            ) {

                strength =
                    "Strong";

            }
            else if (
                absoluteValue >= 0.4
            ) {

                strength =
                    "Moderate";
            }


            const direction =
                correlation >= 0
                    ? "Positive"
                    : "Negative";


            const progress =
                Math.min(
                    100,
                    Math.round(
                        absoluteValue *
                        100
                    )
                );


            container.innerHTML += `

                <div
                    class="border rounded p-3 mb-3"
                >

                    <div
                        class="d-flex
                               justify-content-between
                               align-items-center
                               gap-2"
                    >

                        <div>

                            <strong>
                                ${escapeVisualizationHtml(
                                    column1
                                )}
                            </strong>

                            <span
                                class="mx-2 text-muted"
                            >
                                ↔
                            </span>

                            <strong>
                                ${escapeVisualizationHtml(
                                    column2
                                )}
                            </strong>

                        </div>

                        <span
                            class="badge ${
                                correlation >= 0
                                    ? "bg-success"
                                    : "bg-danger"
                            }"
                        >
                            ${correlation.toFixed(2)}
                        </span>

                    </div>


                    <div
                        class="progress mt-3"
                        style="height: 7px;"
                    >

                        <div
                            class="progress-bar"
                            role="progressbar"
                            style="width: ${progress}%"
                            aria-valuenow="${progress}"
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>

                    </div>


                    <small
                        class="text-muted d-block mt-2"
                    >
                        ${strength}
                        ${direction.toLowerCase()}
                        correlation
                    </small>

                </div>

            `;

        }
    );

}


// =========================================================
// DISTRIBUTION CHART
// =========================================================

function renderDistributionChart(
    data
) {

    const canvas =
        document.getElementById(
            "distributionChart"
        );

    const empty =
        document.getElementById(
            "distributionChartEmpty"
        );


    if (!canvas) return;


    const chartData =
        getChartArray(
            data,
            "distribution"
        );


    if (
        !chartData ||
        chartData.length === 0
    ) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    canvas.classList.remove(
        "d-none"
    );

    empty?.classList.add(
        "d-none"
    );


    // -----------------------------------------------------
    // Backend may provide histogram bins
    // -----------------------------------------------------

    let labels = [];
    let values = [];


    chartData.forEach(
        item => {

            const label =
                item.label ??
                item.bin ??
                item.range ??
                item.interval ??
                item.x ??
                item.name;


            const value =
                item.value ??
                item.count ??
                item.frequency ??
                item.y;


            if (
                label !== undefined &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                labels.push(
                    String(label)
                );

                values.push(
                    Number(value)
                );
            }

        }
    );


    if (!labels.length) {

        canvas.classList.add(
            "d-none"
        );

        empty?.classList.remove(
            "d-none"
        );

        return;
    }


    visualizationCharts.distribution =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Frequency",

                            data:
                                values,

                            borderWidth:
                                1
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: true
                        },

                        tooltip: {
                            enabled: true
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0,

                                callback:
                                    value =>
                                        formatVisualizationNumber(
                                            value
                                        )
                            }
                        }
                    }
                }
            }
        );

}


// =========================================================
// REFRESH BUTTON
// =========================================================

function setupVisualizationRefresh() {

    const button =
        document.getElementById(
            "refreshVisualizationBtn"
        );


    if (!button) {

        console.warn(
            "Refresh Visualization button not found."
        );

        return;
    }


    button.addEventListener(
        "click",
        () => {

            const fileId =
                getSelectedVisualizationFileId();

            if (!fileId) {

                showVisualizationEmpty();

                return;
            }


            loadVisualizations(
                fileId
            );

        }
    );

}


// =========================================================
// SELECTED FILE CHANGE SUPPORT
// =========================================================

function setupVisualizationFileEvents() {

    // -----------------------------------------------------
    // KPI selector
    // -----------------------------------------------------

    const kpiSelector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (kpiSelector) {

        kpiSelector.addEventListener(
            "change",
            event => {

                const fileId =
                    event.target.value;

                if (!fileId) {
                    return;
                }


                localStorage.setItem(
                    "selected_file_id",
                    String(fileId)
                );


                loadVisualizations(
                    fileId
                );

            }
        );

    }


    // -----------------------------------------------------
    // Custom unified event
    // -----------------------------------------------------

    window.addEventListener(
        "selectedFileChanged",
        event => {

            const fileId =
                event?.detail?.fileId ||
                event?.detail?.id ||
                event?.detail;


            if (fileId) {

                loadVisualizations(
                    String(fileId)
                );

            }

        }
    );


    // -----------------------------------------------------
    // Generic dashboard event support
    // -----------------------------------------------------

    window.addEventListener(
        "datasetSelected",
        event => {

            const fileId =
                event?.detail?.fileId ||
                event?.detail?.id ||
                event?.detail;


            if (fileId) {

                loadVisualizations(
                    String(fileId)
                );

            }

        }
    );

}


// =========================================================
// AUTO LOAD
// =========================================================

function initializeVisualizations() {

    console.log(
        "Initializing interactive visualizations..."
    );


    setupVisualizationRefresh();

    setupVisualizationFileEvents();


    // -----------------------------------------------------
    // Initial dataset
    // -----------------------------------------------------

    const fileId =
        getSelectedVisualizationFileId();


    if (fileId) {

        loadVisualizations(
            fileId
        );

    }
    else {

        showVisualizationEmpty();

    }

}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeVisualizations();

    }
);


// =========================================================
// PUBLIC API
// =========================================================

window.loadVisualizations =
    loadVisualizations;

window.renderVisualizations =
    renderVisualizations;

window.destroyVisualizationCharts =
    destroyVisualizationCharts;


// =========================================================
// FINAL
// =========================================================

console.log(
    "Interactive Visualization Dashboard ready."
);