// =========================================================
// EXCEL AI AUTOMATION
// ADVANCED ANALYTICS DASHBOARD
// FINAL STABLE VERSION
// =========================================================

console.log("analytics.js loaded.");


// =========================================================
// GLOBAL STATE
// =========================================================

let currentAnalyticsData = null;
let analyticsRequestInProgress = false;


// =========================================================
// GET AUTH TOKEN
// =========================================================

function getAnalyticsToken() {

    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token")
    );
}


// =========================================================
// GET SELECTED DATASET
// =========================================================

function getSelectedAnalyticsFileId() {

    // -----------------------------------------------------
    // PRIMARY: UNIFIED DATASET SELECTION
    // -----------------------------------------------------

    if (
        typeof window.getUnifiedSelectedFileId ===
        "function"
    ) {

        try {

            const unifiedFileId =
                window.getUnifiedSelectedFileId();

            if (
                unifiedFileId !== null &&
                unifiedFileId !== undefined &&
                String(unifiedFileId).trim() !== ""
            ) {

                return String(
                    unifiedFileId
                );

            }

        } catch (error) {

            console.warn(
                "Unified file selector error:",
                error
            );

        }

    }


    // -----------------------------------------------------
    // FALLBACK: LOCAL STORAGE
    // -----------------------------------------------------

    const storedFileId =
        localStorage.getItem(
            "selected_file_id"
        );

    if (
        storedFileId !== null &&
        storedFileId !== undefined &&
        String(storedFileId).trim() !== ""
    ) {

        return String(
            storedFileId
        );

    }


    // -----------------------------------------------------
    // FALLBACK: KPI SELECTOR
    // -----------------------------------------------------

    const kpiSelector =
        document.getElementById(
            "kpiFileSelector"
        );

    if (
        kpiSelector &&
        kpiSelector.value
    ) {

        return String(
            kpiSelector.value
        );

    }


    return null;
}


// =========================================================
// UI STATE HELPERS
// =========================================================

function getElement(id) {

    return document.getElementById(id);

}


function showAnalyticsLoading() {

    const loading =
        getElement("analyticsLoading");

    if (loading) {

        loading.classList.remove(
            "d-none"
        );

    }


    const error =
        getElement("analyticsError");

    if (error) {

        error.classList.add(
            "d-none"
        );

        error.textContent = "";

    }

}


function hideAnalyticsLoading() {

    const loading =
        getElement("analyticsLoading");

    if (loading) {

        loading.classList.add(
            "d-none"
        );

    }

}


function showAnalyticsError(
    message
) {

    const error =
        getElement("analyticsError");

    if (!error) return;


    error.textContent =
        message ||
        "Unable to load advanced analytics.";


    error.classList.remove(
        "d-none"
    );

}


function hideAnalyticsError() {

    const error =
        getElement("analyticsError");

    if (!error) return;


    error.classList.add(
        "d-none"
    );

    error.textContent = "";

}


function showAnalyticsEmpty(
    message
) {

    const empty =
        getElement("analyticsEmpty");

    if (!empty) return;


    empty.textContent =
        message ||
        "Select a dataset to view advanced analytics.";


    empty.classList.remove(
        "d-none"
    );


    const content =
        getElement("analyticsContent");

    if (content) {

        content.classList.add(
            "d-none"
        );

    }

}


function showAnalyticsContent() {

    const empty =
        getElement("analyticsEmpty");

    if (empty) {

        empty.classList.add(
            "d-none"
        );

    }


    const content =
        getElement("analyticsContent");

    if (content) {

        content.classList.remove(
            "d-none"
        );

    }

}


function setRefreshButtonState(
    loading
) {

    const button =
        getElement(
            "refreshAnalyticsBtn"
        );

    if (!button) return;


    if (loading) {

        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
            ></span>
            Loading...
        `;

    }
    else {

        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-arrow-clockwise"></i>
            Refresh Analytics
        `;

    }

}


// =========================================================
// LOAD ADVANCED ANALYTICS
// =========================================================

async function loadAdvancedAnalytics(
    fileId = null
) {

    // -----------------------------------------------------
    // PREVENT DUPLICATE REQUESTS
    // -----------------------------------------------------

    if (analyticsRequestInProgress) {

        console.warn(
            "Analytics request already in progress."
        );

        return;

    }


    // -----------------------------------------------------
    // GET FILE ID
    // -----------------------------------------------------

    if (!fileId) {

        fileId =
            getSelectedAnalyticsFileId();

    }


    // -----------------------------------------------------
    // NO FILE SELECTED
    // -----------------------------------------------------

    if (!fileId) {

        console.warn(
            "No dataset selected for advanced analytics."
        );

        currentAnalyticsData = null;

        hideAnalyticsLoading();
        hideAnalyticsError();

        showAnalyticsEmpty(
            "Select a dataset to view advanced analytics."
        );

        return;

    }


    analyticsRequestInProgress = true;


    showAnalyticsLoading();
    hideAnalyticsError();
    setRefreshButtonState(true);


    // -----------------------------------------------------
    // AUTHENTICATION
    // -----------------------------------------------------

    const token =
        getAnalyticsToken();


    if (!token) {

        analyticsRequestInProgress = false;

        hideAnalyticsLoading();
        setRefreshButtonState(false);

        const container =
            getElement(
                "analyticsContent"
            );


        if (
            typeof window.renderDashboardAuthError ===
            "function"
        ) {

            window.renderDashboardAuthError(
                container,
                "Your login session has expired. Please login again."
            );

        }
        else {

            showAnalyticsError(
                "Authentication required. Please login again."
            );

        }

        return;
    }


    // -----------------------------------------------------
    // API REQUEST
    // -----------------------------------------------------

    try {

        const response =
            await fetch(
                `/api/analytics/${encodeURIComponent(fileId)}`,
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
        // SAFE JSON RESPONSE
        // -------------------------------------------------

        let data = null;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                `Server returned an invalid response (${response.status}).`
            );

        }


        // -------------------------------------------------
        // HTTP ERROR
        // -------------------------------------------------

        if (!response.ok) {

            let message =
                "Unable to load advanced analytics.";

            if (
                data &&
                typeof data.detail ===
                "string"
            ) {

                message =
                    data.detail;

            }
            else if (
                data &&
                typeof data.message ===
                "string"
            ) {

                message =
                    data.message;

            }


            if (response.status === 401) {

                message =
                    "Your login session has expired. Please login again.";

            }


            throw new Error(
                message
            );

        }


        // -------------------------------------------------
        // API SUCCESS VALIDATION
        // -------------------------------------------------

        if (
            data &&
            data.success === false
        ) {

            throw new Error(
                data.message ||
                data.detail ||
                "Analytics generation failed."
            );

        }


        // -------------------------------------------------
        // STORE RESPONSE
        // -------------------------------------------------

        currentAnalyticsData =
            data || {};


        // -------------------------------------------------
        // RENDER
        // -------------------------------------------------

        renderAdvancedAnalytics(
            currentAnalyticsData
        );


        console.log(
            "ADVANCED ANALYTICS LOADED:",
            currentAnalyticsData
        );

    }
    catch (error) {

        console.error(
            "Advanced Analytics Error:",
            error
        );


        const message =
            error?.message ||
            "Unable to load advanced analytics.";


        const container =
            getElement(
                "analyticsContent"
            );


        if (
            typeof window.renderDashboardError ===
            "function"
        ) {

            window.renderDashboardError(
                container,
                message,

                function () {

                    loadAdvancedAnalytics(
                        fileId
                    );

                }
            );

        }
        else {

            showAnalyticsError(
                message
            );

        }

    }
    finally {

        analyticsRequestInProgress = false;

        hideAnalyticsLoading();

        setRefreshButtonState(false);

    }

}


// =========================================================
// MAIN RENDER
// =========================================================

function renderAdvancedAnalytics(
    data
) {

    if (!data) {

        showAnalyticsEmpty(
            "No analytics data available."
        );

        return;

    }


    // -----------------------------------------------------
    // NORMALIZE DATA
    // -----------------------------------------------------

    const summary =
        data.summary || {};

    const statistics =
        Array.isArray(
            data.statistics
        )
            ? data.statistics
            : [];

    const trends =
        Array.isArray(
            data.trends
        )
            ? data.trends
            : [];

    const distributions =
        Array.isArray(
            data.distributions
        )
            ? data.distributions
            : [];

    const insights =
        Array.isArray(
            data.insights
        )
            ? data.insights
            : [];

    const recommendations =
        Array.isArray(
            data.recommendations
        )
            ? data.recommendations
            : [];

    const correlations =
        data.correlation ||
        data.correlations ||
        {};

    const outliers =
        data.outliers ||
        {};


    // -----------------------------------------------------
    // CHECK WHETHER DATA EXISTS
    // -----------------------------------------------------

    const hasAnalyticsData =
        (
            Number(
                summary.rows || 0
            ) > 0
        ) ||
        statistics.length > 0 ||
        trends.length > 0 ||
        distributions.length > 0 ||
        (
            Array.isArray(
                outliers.columns
            ) &&
            outliers.columns.length > 0
        ) ||
        (
            Array.isArray(
                correlations.strong_relationships
            ) &&
            correlations.strong_relationships.length > 0
        ) ||
        insights.length > 0 ||
        recommendations.length > 0;


    if (!hasAnalyticsData) {

        showAnalyticsEmpty(
            "This dataset does not contain enough information for advanced analysis."
        );

        return;

    }


    // -----------------------------------------------------
    // SHOW CONTENT
    // -----------------------------------------------------

    showAnalyticsContent();


    // -----------------------------------------------------
    // RENDER ALL SECTIONS
    // -----------------------------------------------------

    renderAnalyticsSummary(
        summary,
        outliers
    );

    renderStatistics(
        statistics
    );

    renderCorrelations(
        correlations
    );

    renderOutliers(
        outliers
    );

    renderTrends(
        trends
    );

    renderDistributions(
        distributions
    );

    renderInsights(
        insights
    );

    renderRecommendations(
        recommendations
    );

}


// =========================================================
// SUMMARY CARDS
// =========================================================

function renderAnalyticsSummary(
    summary,
    outlierData
) {

    summary =
        summary || {};

    outlierData =
        outlierData || {};


    // -----------------------------------------------------
    // ROWS
    // -----------------------------------------------------

    const rowsElement =
        getElement(
            "analyticsRows"
        );

    if (rowsElement) {

        rowsElement.textContent =
            formatNumber(
                summary.rows || 0
            );

    }


    // -----------------------------------------------------
    // COLUMNS
    // -----------------------------------------------------

    const columnsElement =
        getElement(
            "analyticsColumns"
        );

    if (columnsElement) {

        columnsElement.textContent =
            formatNumber(
                summary.columns || 0
            );

    }


    // -----------------------------------------------------
    // NUMERIC COLUMNS
    // -----------------------------------------------------

    const numericElement =
        getElement(
            "analyticsNumericColumns"
        );

    if (numericElement) {

        numericElement.textContent =
            formatNumber(
                summary.numeric_columns ||
                summary.numericColumns ||
                0
            );

    }


    // -----------------------------------------------------
    // OUTLIER COLUMNS
    // -----------------------------------------------------

    const outlierElement =
        getElement(
            "analyticsOutlierColumns"
        );

    if (outlierElement) {

        outlierElement.textContent =
            formatNumber(
                outlierData.total_columns_with_outliers ||
                outlierData.total_columns ||
                0
            );

    }

}


// =========================================================
// STATISTICS
// =========================================================

function renderStatistics(
    statistics
) {

    const tbody =
        getElement(
            "analyticsStatisticsTable"
        );

    if (!tbody) return;


    tbody.innerHTML = "";


    if (
        !Array.isArray(statistics) ||
        statistics.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted py-4"
                >
                    No numeric statistics available.
                </td>
            </tr>
        `;

        return;

    }


    statistics.forEach(
        item => {

            item =
                item || {};


            const column =
                item.column ||
                item.name ||
                "-";


            const count =
                item.count ??
                item.Count ??
                0;


            const mean =
                item.mean ??
                0;


            const median =
                item.median ??
                0;


            const minimum =
                item.minimum ??
                item.min ??
                0;


            const maximum =
                item.maximum ??
                item.max ??
                0;


            const standardDeviation =
                item.standard_deviation ??
                item.std ??
                item.std_dev ??
                0;


            tbody.innerHTML += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(column)}
                        </strong>
                    </td>

                    <td>
                        ${formatNumber(count)}
                    </td>

                    <td>
                        ${formatNumber(mean)}
                    </td>

                    <td>
                        ${formatNumber(median)}
                    </td>

                    <td>
                        ${formatNumber(minimum)}
                    </td>

                    <td>
                        ${formatNumber(maximum)}
                    </td>

                    <td>
                        ${formatNumber(
                            standardDeviation
                        )}
                    </td>

                </tr>
            `;

        }
    );

}


// =========================================================
// CORRELATIONS
// =========================================================

function renderCorrelations(
    correlationData
) {

    const container =
        getElement(
            "analyticsCorrelation"
        );

    if (!container) return;


    correlationData =
        correlationData || {};


    const relationships =
        Array.isArray(
            correlationData.strong_relationships
        )
            ? correlationData.strong_relationships
            : Array.isArray(
                correlationData.relationships
            )
                ? correlationData.relationships
                : [];


    if (relationships.length === 0) {

        container.innerHTML = `
            <div class="alert alert-light border mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No strong correlations detected.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    relationships.forEach(
        relationship => {

            relationship =
                relationship || {};


            const value =
                Number(
                    relationship.correlation ??
                    relationship.value ??
                    0
                );


            const safeValue =
                Number.isFinite(value)
                    ? value
                    : 0;


            const badgeClass =
                safeValue >= 0
                    ? "bg-success"
                    : "bg-danger";


            const type =
                relationship.type ||
                (
                    safeValue >= 0
                        ? "Positive"
                        : "Negative"
                );


            container.innerHTML += `
                <div class="border rounded p-3 mb-3">

                    <div
                        class="d-flex justify-content-between align-items-center gap-3"
                    >

                        <div>

                            <strong>
                                ${escapeHtml(
                                    relationship.column_1 ||
                                    relationship.column1 ||
                                    "-"
                                )}
                            </strong>

                            <span class="mx-2 text-muted">
                                ↔
                            </span>

                            <strong>
                                ${escapeHtml(
                                    relationship.column_2 ||
                                    relationship.column2 ||
                                    "-"
                                )}
                            </strong>

                        </div>

                        <span
                            class="badge ${badgeClass}"
                        >
                            ${safeValue.toFixed(2)}
                        </span>

                    </div>

                    <small class="text-muted">
                        ${escapeHtml(type)}
                        correlation
                    </small>

                </div>
            `;

        }
    );

}


// =========================================================
// OUTLIERS
// =========================================================

function renderOutliers(
    outlierData
) {

    const container =
        getElement(
            "analyticsOutliers"
        );

    if (!container) return;


    outlierData =
        outlierData || {};


    const columns =
        Array.isArray(
            outlierData.columns
        )
            ? outlierData.columns
            : [];


    if (columns.length === 0) {

        container.innerHTML = `
            <div class="alert alert-success mb-0">
                <i class="bi bi-check-circle me-2"></i>
                No significant outliers detected.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    columns.forEach(
        item => {

            item =
                item || {};


            const count =
                item.outlier_count ??
                item.count ??
                0;


            const percentage =
                Number(
                    item.outlier_percentage ??
                    item.percentage ??
                    0
                );


            container.innerHTML += `
                <div class="border rounded p-3 mb-3">

                    <div
                        class="d-flex justify-content-between align-items-center"
                    >

                        <strong>
                            ${escapeHtml(
                                item.column ||
                                "-"
                            )}
                        </strong>

                        <span
                            class="badge bg-warning text-dark"
                        >
                            ${formatNumber(count)}
                        </span>

                    </div>

                    <small class="text-muted">

                        ${Number.isFinite(percentage)
                            ? percentage.toFixed(2)
                            : "0.00"}%
                        potential outliers

                    </small>

                </div>
            `;

        }
    );

}


// =========================================================
// TRENDS
// =========================================================

function renderTrends(
    trends
) {

    const tbody =
        getElement(
            "analyticsTrendsTable"
        );

    if (!tbody) return;


    tbody.innerHTML = "";


    if (
        !Array.isArray(trends) ||
        trends.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-muted py-4"
                >
                    No trend information available.
                </td>
            </tr>
        `;

        return;

    }


    trends.forEach(
        trend => {

            trend =
                trend || {};


            const direction =
                trend.direction ||
                "Stable";


            let badgeClass =
                "bg-secondary";


            const normalizedDirection =
                String(
                    direction
                ).toLowerCase();


            if (
                normalizedDirection.includes(
                    "increas"
                )
            ) {

                badgeClass =
                    "bg-success";

            }
            else if (
                normalizedDirection.includes(
                    "decreas"
                )
            ) {

                badgeClass =
                    "bg-danger";

            }


            const change =
                Number(
                    trend.change_percentage ??
                    trend.change ??
                    0
                );


            tbody.innerHTML += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                trend.column ||
                                "-"
                            )}
                        </strong>
                    </td>

                    <td>

                        <span
                            class="badge ${badgeClass}"
                        >
                            ${escapeHtml(
                                direction
                            )}
                        </span>

                    </td>

                    <td>
                        ${Number.isFinite(change)
                            ? change.toFixed(2)
                            : "0.00"}%
                    </td>

                    <td>
                        ${formatNumber(
                            trend.first_value ??
                            trend.firstValue ??
                            0
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            trend.last_value ??
                            trend.lastValue ??
                            0
                        )}
                    </td>

                </tr>
            `;

        }
    );

}


// =========================================================
// DISTRIBUTIONS
// =========================================================

function renderDistributions(
    distributions
) {

    const container =
        getElement(
            "analyticsDistributions"
        );

    if (!container) return;


    if (
        !Array.isArray(distributions) ||
        distributions.length === 0
    ) {

        container.innerHTML = `
            <div class="alert alert-light border mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No distribution analysis available.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    distributions.forEach(
        item => {

            item =
                item || {};


            const distribution =
                item.distribution ||
                item.type ||
                "Unknown";


            let badgeClass =
                "bg-secondary";


            const normalized =
                String(
                    distribution
                ).toLowerCase();


            if (
                normalized.includes(
                    "right"
                )
            ) {

                badgeClass =
                    "bg-warning text-dark";

            }
            else if (
                normalized.includes(
                    "left"
                )
            ) {

                badgeClass =
                    "bg-info text-dark";

            }
            else if (
                normalized.includes(
                    "normal"
                )
            ) {

                badgeClass =
                    "bg-success";

            }


            container.innerHTML += `
                <div
                    class="d-inline-block border rounded p-3 me-2 mb-2"
                >

                    <strong>
                        ${escapeHtml(
                            item.column ||
                            "-"
                        )}
                    </strong>

                    <br>

                    <span
                        class="badge ${badgeClass} mt-2"
                    >
                        ${escapeHtml(
                            distribution
                        )}
                    </span>

                </div>
            `;

        }
    );

}


// =========================================================
// ANALYTICS INSIGHTS
// =========================================================

function renderInsights(
    insights
) {

    const container =
        getElement(
            "analyticsInsights"
        );

    if (!container) return;


    if (
        !Array.isArray(insights) ||
        insights.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted mb-0">
                No automated analytics insights were detected.
            </p>
        `;

        return;

    }


    container.innerHTML = "";


    insights.forEach(
        (insight, index) => {

            let text = "";


            if (
                typeof insight ===
                "string"
            ) {

                text =
                    insight;

            }
            else if (
                insight &&
                typeof insight ===
                "object"
            ) {

                text =
                    insight.text ||
                    insight.message ||
                    insight.insight ||
                    JSON.stringify(
                        insight
                    );

            }
            else {

                text =
                    String(
                        insight ?? ""
                    );

            }


            container.innerHTML += `
                <div class="alert alert-info">

                    <strong>
                        ${index + 1}.
                    </strong>

                    ${escapeHtml(text)}

                </div>
            `;

        }
    );

}


// =========================================================
// ANALYTICS RECOMMENDATIONS
// =========================================================

function renderRecommendations(
    recommendations
) {

    const container =
        getElement(
            "analyticsRecommendations"
        );

    if (!container) return;


    if (
        !Array.isArray(
            recommendations
        ) ||
        recommendations.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted mb-0">
                No specific recommendations available.
            </p>
        `;

        return;

    }


    container.innerHTML = "";


    recommendations.forEach(
        (
            recommendation,
            index
        ) => {

            let text = "";


            if (
                typeof recommendation ===
                "string"
            ) {

                text =
                    recommendation;

            }
            else if (
                recommendation &&
                typeof recommendation ===
                "object"
            ) {

                text =
                    recommendation.text ||
                    recommendation.message ||
                    recommendation.recommendation ||
                    JSON.stringify(
                        recommendation
                    );

            }
            else {

                text =
                    String(
                        recommendation ?? ""
                    );

            }


            container.innerHTML += `
                <div class="alert alert-success">

                    <strong>
                        ${index + 1}.
                    </strong>

                    ${escapeHtml(text)}

                </div>
            `;

        }
    );

}


// =========================================================
// NUMBER FORMATTER
// =========================================================

function formatNumber(
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

function escapeHtml(
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
// REFRESH BUTTON
// =========================================================

function initializeAnalyticsRefresh() {

    const button =
        getElement(
            "refreshAnalyticsBtn"
        );


    if (!button) {

        console.warn(
            "Refresh Analytics button not found."
        );

        return;

    }


    if (
        button.dataset.analyticsBound ===
        "true"
    ) {

        return;

    }


    button.dataset.analyticsBound =
        "true";


    button.addEventListener(
        "click",
        function () {

            loadAdvancedAnalytics();

        }
    );

}


// =========================================================
// DATASET CHANGE SUPPORT
// =========================================================

function initializeAnalyticsDatasetSync() {

    const selector =
        getElement(
            "kpiFileSelector"
        );


    if (!selector) return;


    if (
        selector.dataset.analyticsBound ===
        "true"
    ) {

        return;

    }


    selector.dataset.analyticsBound =
        "true";


    selector.addEventListener(
        "change",
        function () {

            const fileId =
                selector.value;


            if (!fileId) {

                showAnalyticsEmpty(
                    "Select a dataset to view advanced analytics."
                );

                return;

            }


            try {

                localStorage.setItem(
                    "selected_file_id",
                    String(fileId)
                );

            } catch (storageError) {

                console.warn(
                    "Unable to save selected file:",
                    storageError
                );

            }


            loadAdvancedAnalytics(
                fileId
            );

        }
    );

}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Initializing Advanced Analytics..."
        );


        initializeAnalyticsRefresh();

        initializeAnalyticsDatasetSync();


        // -------------------------------------------------
        // DO NOT FORCE API CALL IF DASHBOARD-SYNC
        // WILL LOAD IT.
        // -------------------------------------------------

        const selectedFileId =
            getSelectedAnalyticsFileId();


        if (selectedFileId) {

            // Small delay allows KPI / dashboard-sync
            // initialization to complete first.

            setTimeout(
                function () {

                    if (
                        !currentAnalyticsData
                    ) {

                        loadAdvancedAnalytics(
                            selectedFileId
                        );

                    }

                },
                300
            );

        }
        else {

            showAnalyticsEmpty(
                "Select a dataset to view advanced analytics."
            );

        }

    }
);


// =========================================================
// GLOBAL EXPORTS
// =========================================================

window.loadAdvancedAnalytics =
    loadAdvancedAnalytics;

window.renderAdvancedAnalytics =
    renderAdvancedAnalytics;

window.getSelectedAnalyticsFileId =
    getSelectedAnalyticsFileId;


// =========================================================
// FINAL LOG
// =========================================================

console.log(
    "Advanced Analytics Dashboard ready."
);