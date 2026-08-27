// =========================================================
// EXCEL AI AUTOMATION
// ADVANCED ANALYTICS DASHBOARD
// =========================================================

console.log("analytics.js loaded.");


// =========================================================
// STATE
// =========================================================

let currentAnalyticsData = null;


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
// GET SELECTED FILE
// =========================================================

function getSelectedAnalyticsFileId() {

    // -----------------------------------------------------
    // CENTRAL UNIFIED DATASET
    // -----------------------------------------------------

    if (
        typeof window.getUnifiedSelectedFileId ===
        "function"
    ) {

        const unifiedFileId =
            window.getUnifiedSelectedFileId();


        if (unifiedFileId) {

            return String(
                unifiedFileId
            );

        }

    }


    // -----------------------------------------------------
    // LOCAL STORAGE FALLBACK
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


    return null;
}
// =========================================================
// UI HELPERS
// =========================================================

function showAnalyticsLoading() {

    document
        .getElementById("analyticsLoading")
        ?.classList.remove("d-none");

    document
        .getElementById("analyticsError")
        ?.classList.add("d-none");
}


function hideAnalyticsLoading() {

    document
        .getElementById("analyticsLoading")
        ?.classList.add("d-none");
}


function showAnalyticsError(message) {

    const element = document.getElementById(
        "analyticsError"
    );

    if (!element) return;

    element.textContent = message;

    element.classList.remove(
        "d-none"
    );
}


function showAnalyticsContent() {

    document
        .getElementById("analyticsEmpty")
        ?.classList.add("d-none");

    document
        .getElementById("analyticsContent")
        ?.classList.remove("d-none");
}


// =========================================================
// LOAD ANALYTICS
// =========================================================

async function loadAdvancedAnalytics(
    fileId = null
) {

    if (!fileId) {

        fileId =
            getSelectedAnalyticsFileId();
    }

    if (!fileId) {

        console.warn(
            "No file selected for analytics."
        );

        return;
    }

    showAnalyticsLoading();


const analyticsContent =
    document.getElementById(
        "analyticsContent"
    );


if (
    analyticsContent &&
    typeof window.renderDashboardSkeleton ===
    "function"
) {

    window.renderDashboardSkeleton(
        analyticsContent,
        4
    );

}


    try {

        const token =
    getAnalyticsToken();


if (!token) {

    const container =
        document.getElementById(
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
            "Authentication required."
        );

    }


    hideAnalyticsLoading();

    return;
}


const headers = {

    "Accept":
        "application/json",

    "Authorization":
        `Bearer ${token}`

};


        const response = await fetch(
            `/api/analytics/${fileId}`,
            {
                method: "GET",
                headers: headers
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load advanced analytics."
            );
        }


        if (!data.success) {

            throw new Error(
                "Analytics generation failed."
            );
        }


        currentAnalyticsData =
            data;


        renderAdvancedAnalytics(
            data
        );


        console.log(
            "ADVANCED ANALYTICS:",
            data
        );

    }

catch (error) {

    console.error(
        "Analytics Error:",
        error
    );


    const container =
        document.getElementById(
            "analyticsContent"
        );


    if (
        typeof window.renderDashboardError ===
        "function"
    ) {

        window.renderDashboardError(
            container,
            error.message ||
            "Unable to load advanced analytics.",

            function () {

                loadAdvancedAnalytics(
                    fileId
                );

            }

        );

    }
    else {

        showAnalyticsError(
            error.message
        );

    }

}

    finally {

        hideAnalyticsLoading();
    }
}


// =========================================================
// RENDER MAIN ANALYTICS
// =========================================================

function renderAdvancedAnalytics(data) {

    if (!data) {
        return;
    }


    const hasAnalyticsData =
        (
            Array.isArray(data.statistics) &&
            data.statistics.length > 0
        ) ||
        (
            Array.isArray(data.trends) &&
            data.trends.length > 0
        ) ||
        (
            Array.isArray(data.distributions) &&
            data.distributions.length > 0
        );


    if (!hasAnalyticsData) {

        const container =
            document.getElementById(
                "analyticsContent"
            );


        if (
            typeof window.renderDashboardEmpty ===
            "function"
        ) {

            window.renderDashboardEmpty(
                container,
                "No Advanced Analytics Available",
                "This dataset does not contain enough information for advanced analysis."
            );

        }

        return;
    }


    showAnalyticsContent();

    renderAnalyticsSummary(
        data.summary,
        data.outliers
    );

    renderStatistics(
        data.statistics
    );

    renderCorrelations(
        data.correlation
    );

    renderOutliers(
        data.outliers
    );

    renderTrends(
        data.trends
    );

    renderDistributions(
        data.distributions
    );

    renderInsights(
        data.insights
    );

    renderRecommendations(
        data.recommendations
    );
}


function renderAdvancedAnalytics(
    data
) {

    showAnalyticsContent();

    renderAnalyticsSummary(
        data.summary,
        data.outliers
    );

    renderStatistics(
        data.statistics
    );

    renderCorrelations(
        data.correlation
    );

    renderOutliers(
        data.outliers
    );

    renderTrends(
        data.trends
    );

    renderDistributions(
        data.distributions
    );

    renderInsights(
        data.insights
    );

    renderRecommendations(
        data.recommendations
    );
}


// =========================================================
// SUMMARY
// =========================================================

function renderAnalyticsSummary(
    summary,
    outlierData
) {

    // -----------------------------------------------------
    // ROWS
    // -----------------------------------------------------

    const rowsElement =
        document.getElementById(
            "analyticsRows"
        );

    if (rowsElement) {

        rowsElement.textContent =
            Number(
                summary?.rows || 0
            ).toLocaleString();
    }


    // -----------------------------------------------------
    // COLUMNS
    // -----------------------------------------------------

    const columnsElement =
        document.getElementById(
            "analyticsColumns"
        );

    if (columnsElement) {

        columnsElement.textContent =
            Number(
                summary?.columns || 0
            ).toLocaleString();
    }


    // -----------------------------------------------------
    // NUMERIC COLUMNS
    // -----------------------------------------------------

    const numericColumnsElement =
        document.getElementById(
            "analyticsNumericColumns"
        );

    if (numericColumnsElement) {

        numericColumnsElement.textContent =
            Number(
                summary?.numeric_columns || 0
            ).toLocaleString();
    }


    // -----------------------------------------------------
    // OUTLIER COLUMNS
    // -----------------------------------------------------

    const outlierColumnsElement =
        document.getElementById(
            "analyticsOutlierColumns"
        );

    if (outlierColumnsElement) {

        outlierColumnsElement.textContent =
            Number(
                outlierData?.total_columns_with_outliers || 0
            ).toLocaleString();
    }

}
// =========================================================
// STATISTICS
// =========================================================

function renderStatistics(
    statistics
) {

    const tbody =
        document.getElementById(
            "analyticsStatisticsTable"
        );

    if (!tbody) return;

    tbody.innerHTML = "";


    if (
        !statistics ||
        statistics.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    class="text-center text-muted">
                    No numeric statistics available.
                </td>
            </tr>
        `;

        return;
    }


    statistics.forEach(
        item => {

            tbody.innerHTML += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(item.column)}
                        </strong>
                    </td>

                    <td>
                        ${formatNumber(item.count)}
                    </td>

                    <td>
                        ${formatNumber(item.mean)}
                    </td>

                    <td>
                        ${formatNumber(item.median)}
                    </td>

                    <td>
                        ${formatNumber(item.minimum)}
                    </td>

                    <td>
                        ${formatNumber(item.maximum)}
                    </td>

                    <td>
                        ${formatNumber(
                            item.standard_deviation
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
        document.getElementById(
            "analyticsCorrelation"
        );

    if (!container) return;


    const relationships =
        correlationData?.strong_relationships ||
        [];


    if (relationships.length === 0) {

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

            const value =
                Number(
                    relationship.correlation
                );


            const badgeClass =
                value >= 0
                    ? "bg-success"
                    : "bg-danger";


            container.innerHTML += `
                <div class="border rounded p-3 mb-3">

                    <div class="d-flex
                                justify-content-between
                                align-items-center">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    relationship.column_1
                                )}
                            </strong>

                            <span class="mx-2">
                                ↔
                            </span>

                            <strong>
                                ${escapeHtml(
                                    relationship.column_2
                                )}
                            </strong>

                        </div>

                        <span
                            class="badge ${badgeClass}"
                        >
                            ${value.toFixed(2)}
                        </span>

                    </div>

                    <small class="text-muted">
                        ${escapeHtml(
                            relationship.type
                        )} correlation
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
        document.getElementById(
            "analyticsOutliers"
        );

    if (!container) return;


    const columns =
        outlierData?.columns || [];


    if (columns.length === 0) {

        container.innerHTML = `
            <div class="alert alert-success mb-0">
                ✓ No significant outliers detected.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    columns.forEach(
        item => {

            container.innerHTML += `
                <div class="border rounded p-3 mb-3">

                    <div class="d-flex
                                justify-content-between">

                        <strong>
                            ${escapeHtml(
                                item.column
                            )}
                        </strong>

                        <span
                            class="badge bg-warning text-dark"
                        >
                            ${formatNumber(
                                item.outlier_count
                            )}
                        </span>

                    </div>

                    <small class="text-muted">

                        ${Number(
                            item.outlier_percentage || 0
                        ).toFixed(2)}%
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
        document.getElementById(
            "analyticsTrendsTable"
        );

    if (!tbody) return;

    tbody.innerHTML = "";


    if (!trends || trends.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    class="text-center text-muted">
                    No trend information available.
                </td>
            </tr>
        `;

        return;
    }


    trends.forEach(
        trend => {

            let badgeClass =
                "bg-secondary";


            if (
                trend.direction ===
                "Increasing"
            ) {

                badgeClass =
                    "bg-success";
            }


            if (
                trend.direction ===
                "Decreasing"
            ) {

                badgeClass =
                    "bg-danger";
            }


            tbody.innerHTML += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                trend.column
                            )}
                        </strong>
                    </td>

                    <td>

                        <span
                            class="badge ${badgeClass}"
                        >
                            ${escapeHtml(
                                trend.direction
                            )}
                        </span>

                    </td>

                    <td>
                        ${Number(
                            trend.change_percentage || 0
                        ).toFixed(2)}%
                    </td>

                    <td>
                        ${formatNumber(
                            trend.first_value
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            trend.last_value
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
        document.getElementById(
            "analyticsDistributions"
        );

    if (!container) return;


    if (
        !distributions ||
        distributions.length === 0
    ) {

        container.innerHTML = `
            <div class="text-muted">
                No distribution analysis available.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    distributions.forEach(
        item => {

            let badgeClass =
                "bg-secondary";


            if (
                item.distribution ===
                "Right Skewed"
            ) {

                badgeClass =
                    "bg-warning text-dark";
            }


            if (
                item.distribution ===
                "Left Skewed"
            ) {

                badgeClass =
                    "bg-info text-dark";
            }


            container.innerHTML += `
                <div class="d-inline-block
                            border rounded
                            p-3 me-2 mb-2">

                    <strong>
                        ${escapeHtml(
                            item.column
                        )}
                    </strong>

                    <br>

                    <span
                        class="badge ${badgeClass} mt-2"
                    >
                        ${escapeHtml(
                            item.distribution
                        )}
                    </span>

                </div>
            `;
        }
    );
}


// =========================================================
// INSIGHTS
// =========================================================

function renderInsights(
    insights
) {

    const container =
        document.getElementById(
            "analyticsInsights"
        );

    if (!container) return;


    if (
        !insights ||
        insights.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted mb-0">
                No automated analytics insights
                were detected.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    insights.forEach(
        (insight, index) => {

            container.innerHTML += `
                <div class="alert alert-info">

                    <strong>
                        ${index + 1}.
                    </strong>

                    ${escapeHtml(
                        insight
                    )}

                </div>
            `;
        }
    );
}


// =========================================================
// RECOMMENDATIONS
// =========================================================

function renderRecommendations(
    recommendations
) {

    const container =
        document.getElementById(
            "analyticsRecommendations"
        );

    if (!container) return;


    if (
        !recommendations ||
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
        (recommendation, index) => {

            container.innerHTML += `
                <div class="alert alert-success">

                    <strong>
                        ${index + 1}.
                    </strong>

                    ${escapeHtml(
                        recommendation
                    )}

                </div>
            `;
        }
    );
}


// =========================================================
// FORMAT NUMBER
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

    return String(value ?? "")
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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById(
                "refreshAnalyticsBtn"
            );


        if (button) {

            button.addEventListener(
                "click",
                () => {

                    loadAdvancedAnalytics();
                }
            );
        }

    }
);


// =========================================================
// AUTO LOAD EVENT SUPPORT
// =========================================================

window.loadAdvancedAnalytics =
    loadAdvancedAnalytics;

window.renderAdvancedAnalytics =
    renderAdvancedAnalytics;

console.log(
    "Advanced Analytics Dashboard ready."
);