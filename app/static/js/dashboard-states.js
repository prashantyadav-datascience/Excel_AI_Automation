// =========================================================
// EXCEL AI AUTOMATION
// UNIFIED DASHBOARD STATES
// STEP 8.13
// =========================================================

console.log("dashboard-states.js loaded.");


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeDashboardStateHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================================
// LOADING STATE
// =========================================================

function renderDashboardLoading(
    container,
    title = "Analyzing dataset...",
    message = "Please wait while AI processes your data."
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state">

            <div class="dashboard-state-card">

                <div class="dashboard-state-icon">

                    <div class="dashboard-spinner"></div>

                </div>

                <div class="dashboard-state-title">

                    ${escapeDashboardStateHTML(title)}

                </div>

                <div class="dashboard-state-message">

                    ${escapeDashboardStateHTML(message)}

                </div>

            </div>

        </div>

    `;

}


// =========================================================
// SKELETON STATE
// =========================================================

function renderDashboardSkeleton(
    container,
    count = 3
) {

    if (!container) {
        return;
    }


    let skeletons = "";


    for (
        let i = 0;
        i < count;
        i++
    ) {

        skeletons += `

            <div class="col-xl-4 col-lg-6 mb-3">

                <div class="dashboard-skeleton">

                    <div
                        class="dashboard-skeleton-line
                               large"
                    ></div>

                    <div
                        class="dashboard-skeleton-line
                               medium"
                    ></div>

                    <div
                        class="dashboard-skeleton-line
                               small"
                    ></div>

                </div>

            </div>

        `;

    }


    container.innerHTML = `

        <div class="row">

            ${skeletons}

        </div>

    `;

}


// =========================================================
// EMPTY STATE
// =========================================================

function renderDashboardEmpty(
    container,
    title = "No data available",
    message = "There is not enough data to generate this analysis."
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state">

            <div
                class="
                    dashboard-state-card
                    dashboard-state-empty
                "
            >

                <div class="dashboard-state-icon">

                    📭

                </div>

                <div class="dashboard-state-title">

                    ${escapeDashboardStateHTML(title)}

                </div>

                <div class="dashboard-state-message">

                    ${escapeDashboardStateHTML(message)}

                </div>

            </div>

        </div>

    `;

}


// =========================================================
// ERROR STATE
// =========================================================

function renderDashboardError(
    container,
    message = "Something went wrong.",
    retryFunction = null
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state">

            <div
                class="
                    dashboard-state-card
                    dashboard-state-error
                "
            >

                <div class="dashboard-state-icon">

                    ❌

                </div>

                <div class="dashboard-state-title">

                    Unable to load data

                </div>

                <div class="dashboard-state-message">

                    ${escapeDashboardStateHTML(message)}

                </div>

                ${
                    retryFunction
                    ?
                    `
                    <button
                        type="button"
                        class="
                            dashboard-state-btn
                            dashboard-retry-btn
                        "
                        id="dashboardRetryButton"
                    >

                        🔄 Retry

                    </button>
                    `
                    :
                    ""
                }

            </div>

        </div>

    `;


    if (retryFunction) {

        const button =
            document.getElementById(
                "dashboardRetryButton"
            );


        if (button) {

            button.addEventListener(
                "click",
                retryFunction
            );

        }

    }

}


// =========================================================
// AUTH ERROR
// =========================================================

function renderDashboardAuthError(
    container,
    message =
        "Your session has expired. Please login again."
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state">

            <div
                class="
                    dashboard-state-card
                    dashboard-state-auth
                "
            >

                <div class="dashboard-state-icon">

                    🔐

                </div>

                <div class="dashboard-state-title">

                    Authentication Required

                </div>

                <div class="dashboard-state-message">

                    ${escapeDashboardStateHTML(message)}

                </div>

                <button
                    type="button"
                    class="
                        dashboard-state-btn
                        dashboard-login-btn
                    "
                    onclick="window.location.href='/login'"
                >

                    🔑 Login Again

                </button>

            </div>

        </div>

    `;

}


// =========================================================
// SUCCESS STATE
// =========================================================

function renderDashboardSuccess(
    container,
    message = "Data loaded successfully."
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state">

            <div
                class="
                    dashboard-state-card
                    dashboard-state-success
                "
            >

                <div class="dashboard-state-icon">

                    ✓

                </div>

                <div class="dashboard-state-title">

                    Analysis Complete

                </div>

                <div class="dashboard-state-message">

                    ${escapeDashboardStateHTML(message)}

                </div>

            </div>

        </div>

    `;

}


// =========================================================
// EXPORT GLOBAL FUNCTIONS
// =========================================================

window.renderDashboardLoading =
    renderDashboardLoading;

window.renderDashboardSkeleton =
    renderDashboardSkeleton;

window.renderDashboardEmpty =
    renderDashboardEmpty;

window.renderDashboardError =
    renderDashboardError;

window.renderDashboardAuthError =
    renderDashboardAuthError;

window.renderDashboardSuccess =
    renderDashboardSuccess;


console.log(
    "Unified dashboard states ready."
);