// =========================================================
// EXCEL AI AUTOMATION
// AI BUSINESS INSIGHTS DASHBOARD
// =========================================================

console.log("insights.js loaded.");


// =========================================================
// STATE
// =========================================================

let currentInsightsData = null;
let insightsLoading = false;


// =========================================================
// AUTH TOKEN
// =========================================================

function getInsightsToken() {

    const possibleKeys = [
        "access_token",
        "token",
        "auth_token",
        "jwt_token"
    ];

    for (const key of possibleKeys) {

        const localValue =
            localStorage.getItem(key);

        if (localValue) {
            return localValue;
        }

        const sessionValue =
            sessionStorage.getItem(key);

        if (sessionValue) {
            return sessionValue;
        }
    }

    return null;
}


// =========================================================
// CLEAR AUTH
// =========================================================

function clearInsightsAuth() {

    const keys = [
        "access_token",
        "token",
        "auth_token",
        "jwt_token"
    ];

    keys.forEach(key => {

        localStorage.removeItem(key);
        sessionStorage.removeItem(key);

    });
}


// =========================================================
// SELECTED FILE
// IMPORTANT:
// Does NOT call dashboard-sync.js
// This avoids recursive call / stack overflow.
// =========================================================

function getSelectedInsightsFileId(fileId = null) {

    if (
        fileId !== null &&
        fileId !== undefined &&
        String(fileId).trim() !== ""
    ) {

        return String(fileId);
    }


    // -----------------------------------------------------
    // KPI SELECTOR
    // -----------------------------------------------------

    const kpiSelector =
        document.getElementById(
            "kpiFileSelector"
        );

    if (
        kpiSelector &&
        kpiSelector.value
    ) {

        return kpiSelector.value;
    }


    // -----------------------------------------------------
    // OTHER SELECTORS
    // -----------------------------------------------------

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

            return element.value;
        }
    }


    // -----------------------------------------------------
    // LOCAL STORAGE
    // -----------------------------------------------------

    const storedKeys = [
        "selected_file_id",
        "selectedFileId",
        "current_file_id"
    ];


    for (const key of storedKeys) {

        const value =
            localStorage.getItem(key);

        if (value) {
            return value;
        }
    }


    return null;
}


// =========================================================
// STATUS
// =========================================================

function setInsightsStatus(
    message,
    type = "info"
) {

    const status =
        document.getElementById(
            "insightsStatus"
        );


    if (!status) {
        return;
    }


    if (!message) {

        status.className =
            "alert alert-light border d-none";

        status.textContent = "";

        return;
    }


    const typeClassMap = {

        info: "alert-info",

        success: "alert-success",

        warning: "alert-warning",

        error: "alert-danger"

    };


    const alertClass =
        typeClassMap[type] ||
        "alert-info";


    status.className =
        `alert ${alertClass} border`;


    status.textContent =
        message;
}


// =========================================================
// SHOW / HIDE CONTAINERS
// =========================================================

function showInsightsContainer() {

    const container =
        document.getElementById(
            "insightsContainer"
        );

    if (container) {

        container.classList.remove(
            "d-none"
        );
    }
}


function hideInsightsContainer() {

    const container =
        document.getElementById(
            "insightsContainer"
        );

    if (container) {

        container.classList.add(
            "d-none"
        );
    }
}


function showInsightsSummary() {

    const summary =
        document.getElementById(
            "insightsSummary"
        );

    if (summary) {

        summary.classList.remove(
            "d-none"
        );
    }
}


function hideInsightsSummary() {

    const summary =
        document.getElementById(
            "insightsSummary"
        );

    if (summary) {

        summary.classList.add(
            "d-none"
        );
    }
}


// =========================================================
// REFRESH BUTTON
// =========================================================

function setRefreshButtonLoading(
    loading
) {

    const button =
        document.getElementById(
            "refreshInsightsButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (loading) {

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Generating...
        `;

    }
    else {

        button.innerHTML = `
            <i class="fa-solid fa-rotate"></i>
            Refresh Insights
        `;

    }
}


// =========================================================
// SKELETON LOADING
// =========================================================

function renderLoadingState() {

    const insights =
        document.getElementById(
            "businessInsightsList"
        );


    const recommendations =
        document.getElementById(
            "businessRecommendationsList"
        );


    const skeleton = () => `

        <div class="dashboard-state dashboard-loading">

            <div class="dashboard-skeleton-icon">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
            </div>

            <div class="dashboard-skeleton-lines">

                <span></span>

                <span></span>

                <span></span>

            </div>

            <div class="dashboard-state-text">
                AI is analyzing your dataset...
            </div>

        </div>

    `;


    if (insights) {

        insights.innerHTML =
            skeleton();

    }


    if (recommendations) {

        recommendations.innerHTML = `

            <div class="dashboard-state dashboard-loading">

                <div class="dashboard-skeleton-icon">
                    <i class="fa-solid fa-lightbulb"></i>
                </div>

                <div class="dashboard-skeleton-lines">

                    <span></span>

                    <span></span>

                    <span></span>

                </div>

                <div class="dashboard-state-text">
                    Generating recommendations...
                </div>

            </div>

        `;

    }
}


// =========================================================
// EMPTY STATE
// =========================================================

function renderInsightsEmptyState(
    title = "No Business Insights",
    message = "No meaningful insights were detected for this dataset."
) {

    const container =
        document.getElementById(
            "businessInsightsList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state dashboard-empty">

            <div class="dashboard-state-icon">

                <i class="fa-solid fa-chart-line"></i>

            </div>

            <h6>
                ${escapeHtml(title)}
            </h6>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                id="emptyInsightsRetry"
            >

                <i class="fa-solid fa-rotate"></i>

                Refresh Insights

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "emptyInsightsRetry"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => loadBusinessInsights()
        );

    }
}


// =========================================================
// RECOMMENDATION EMPTY
// =========================================================

function renderRecommendationsEmptyState() {

    const container =
        document.getElementById(
            "businessRecommendationsList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="dashboard-state dashboard-empty">

            <div class="dashboard-state-icon">

                <i class="fa-solid fa-lightbulb"></i>

            </div>

            <h6>
                No Recommendations
            </h6>

            <p>
                AI did not detect any actionable opportunities
                in the selected dataset.
            </p>

        </div>

    `;
}


// =========================================================
// AUTH ERROR STATE
// =========================================================

function renderInsightsAuthError() {

    const insightsContainer =
        document.getElementById(
            "businessInsightsList"
        );


    const recommendationsContainer =
        document.getElementById(
            "businessRecommendationsList"
        );


    const authHTML = `

        <div class="dashboard-state dashboard-auth-error">

            <div class="dashboard-state-icon">

                <i class="fa-solid fa-lock"></i>

            </div>

            <h6>
                Session Expired
            </h6>

            <p>
                Your login session has expired.
                Please login again to continue using AI Insights.
            </p>

            <button
                type="button"
                class="btn btn-primary btn-sm"
                id="insightsLoginButton"
            >

                <i class="fa-solid fa-right-to-bracket"></i>

                Login Again

            </button>

        </div>

    `;


    if (insightsContainer) {

        insightsContainer.innerHTML =
            authHTML;

    }


    if (recommendationsContainer) {

        recommendationsContainer.innerHTML = `

            <div class="dashboard-state dashboard-auth-error">

                <div class="dashboard-state-icon">

                    <i class="fa-solid fa-lock"></i>

                </div>

                <h6>
                    Authentication Required
                </h6>

                <p>
                    Login again to generate recommendations.
                </p>

            </div>

        `;

    }


    const loginButton =
        document.getElementById(
            "insightsLoginButton"
        );


    if (loginButton) {

        loginButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "/login";

            }
        );

    }


    setInsightsStatus(
        "Your session has expired. Please login again.",
        "warning"
    );


    hideInsightsSummary();
}


// =========================================================
// GENERAL ERROR STATE
// =========================================================

function renderInsightsError(
    message,
    retryCallback
) {

    const insightsContainer =
        document.getElementById(
            "businessInsightsList"
        );


    const recommendationsContainer =
        document.getElementById(
            "businessRecommendationsList"
        );


    if (insightsContainer) {

        insightsContainer.innerHTML = `

            <div class="dashboard-state dashboard-error">

                <div class="dashboard-state-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h6>
                    Unable to Load AI Insights
                </h6>

                <p>
                    ${escapeHtml(
                        message ||
                        "Something went wrong while generating insights."
                    )}
                </p>

                <button
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    id="insightsRetryButton"
                >

                    <i class="fa-solid fa-rotate"></i>

                    Retry

                </button>

            </div>

        `;

    }


    if (recommendationsContainer) {

        recommendationsContainer.innerHTML = `

            <div class="dashboard-state dashboard-error">

                <div class="dashboard-state-icon">

                    <i class="fa-solid fa-circle-exclamation"></i>

                </div>

                <h6>
                    Recommendations Unavailable
                </h6>

                <p>
                    AI recommendations could not be generated.
                </p>

            </div>

        `;

    }


    const retryButton =
        document.getElementById(
            "insightsRetryButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                if (
                    typeof retryCallback ===
                    "function"
                ) {

                    retryCallback();

                }
                else {

                    loadBusinessInsights();

                }

            }
        );

    }
}


// =========================================================
// LOAD BUSINESS INSIGHTS
// =========================================================

async function loadBusinessInsights(
    fileId = null
) {

    if (insightsLoading) {

        console.log(
            "AI Insights request already running."
        );

        return;
    }


    fileId =
        getSelectedInsightsFileId(
            fileId
        );


    // =====================================================
    // NO DATASET
    // =====================================================

    if (!fileId) {

        console.log(
            "No dataset selected for AI Insights."
        );


        hideInsightsSummary();


        const insights =
            document.getElementById(
                "businessInsightsList"
            );


        const recommendations =
            document.getElementById(
                "businessRecommendationsList"
            );


        if (insights) {

            insights.innerHTML = `

                <div class="dashboard-state dashboard-empty">

                    <div class="dashboard-state-icon">

                        <i class="fa-solid fa-file-circle-question"></i>

                    </div>

                    <h6>
                        No Dataset Selected
                    </h6>

                    <p>
                        Select a dataset above to generate
                        AI business insights.
                    </p>

                </div>

            `;

        }


        if (recommendations) {

            recommendations.innerHTML = `

                <div class="dashboard-state dashboard-empty">

                    <div class="dashboard-state-icon">

                        <i class="fa-solid fa-lightbulb"></i>

                    </div>

                    <h6>
                        Waiting for Dataset
                    </h6>

                    <p>
                        Select a dataset to generate recommendations.
                    </p>

                </div>

            `;

        }


        setInsightsStatus(
            "Please select a dataset first.",
            "warning"
        );


        return;
    }


    // =====================================================
    // SAVE SELECTED FILE
    // =====================================================

    localStorage.setItem(
        "selected_file_id",
        String(fileId)
    );


    // =====================================================
    // AUTH TOKEN
    // =====================================================

    const token =
        getInsightsToken();


    if (!token) {

        console.warn(
            "No authentication token found."
        );


        renderInsightsAuthError();

        return;
    }


    // =====================================================
    // START LOADING
    // =====================================================

    insightsLoading = true;


    setRefreshButtonLoading(
        true
    );


    setInsightsStatus(
        "AI is analyzing your dataset...",
        "info"
    );


    showInsightsContainer();


    renderLoadingState();


    try {

        console.log(
            "Loading AI insights for file:",
            fileId
        );


        const response =
            await fetch(
                `/api/insights/${encodeURIComponent(fileId)}`,
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


        // =================================================
        // READ RESPONSE SAFELY
        // =================================================

        let data = {};

        try {

            data =
                await response.json();

        }
        catch {

            data = {};

        }


        console.log(
            "AI INSIGHTS API RESPONSE:",
            data
        );


        // =================================================
        // AUTH ERROR
        // =================================================

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            console.warn(
                "Authentication failed for AI Insights."
            );


            clearInsightsAuth();


            renderInsightsAuthError();


            return;
        }


        // =================================================
        // OTHER API ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                `AI Insights API returned ${response.status}.`
            );

        }


        // =================================================
        // BACKEND SUCCESS CHECK
        // =================================================

        if (
            data.success === false
        ) {

            throw new Error(
                data.detail ||
                data.message ||
                "AI business insights generation failed."
            );

        }


        // =================================================
        // SAVE RESPONSE
        // =================================================

        currentInsightsData =
            data;


        // =================================================
        // RENDER SUCCESS
        // =================================================

        renderBusinessInsights(
            data
        );


        setInsightsStatus(
            "AI business insights generated successfully.",
            "success"
        );


        // Auto-hide success message

        setTimeout(
            () => {

                const status =
                    document.getElementById(
                        "insightsStatus"
                    );


                if (status) {

                    status.classList.add(
                        "d-none"
                    );

                }

            },
            3500
        );


    }
    catch (error) {

        console.error(
            "AI Insights Error:",
            error
        );


        renderInsightsError(
            error.message,
            () => {

                loadBusinessInsights(
                    fileId
                );

            }
        );


        setInsightsStatus(
            error.message ||
            "Unable to generate AI business insights.",
            "error"
        );

    }
    finally {

        insightsLoading = false;


        setRefreshButtonLoading(
            false
        );

    }
}


// =========================================================
// MAIN RENDER
// =========================================================

function renderBusinessInsights(
    data
) {

    showInsightsContainer();


    const result =
        data.insights || {};


    const insights =
        Array.isArray(
            result.insights
        )
            ? result.insights
            : [];


    const recommendations =
        Array.isArray(
            result.recommendations
        )
            ? result.recommendations
            : [];


    const summary =
        result.summary || {};


    const domains =
        Array.isArray(
            result.domains
        )
            ? result.domains
            : [];


    const kpiData =
        data.kpis || {};


    // =====================================================
    // SUMMARY
    // =====================================================

    renderFileSummary(
        data,
        summary,
        domains,
        kpiData
    );


    // =====================================================
    // INSIGHTS
    // =====================================================

    renderInsightList(
        insights
    );


    // =====================================================
    // RECOMMENDATIONS
    // =====================================================

    renderRecommendationList(
        recommendations
    );


    console.log(
        `Rendered ${insights.length} insights and ${recommendations.length} recommendations.`
    );
}


// =========================================================
// FILE + KPI SUMMARY
// =========================================================

function renderFileSummary(
    data,
    summary,
    domains,
    kpiData
) {

    const fileName =
        document.getElementById(
            "insightsFileName"
        );


    if (fileName) {

        fileName.textContent =
            data.filename ||
            data.file_name ||
            "Selected Dataset";

    }


    const rows =
        document.getElementById(
            "insightsRows"
        );


    if (rows) {

        const totalRows =
            Number(
                summary.rows ??
                data.total_rows ??
                data.rows ??
                0
            );


        rows.textContent =
            totalRows.toLocaleString();

    }


    const kpiCount =
        document.getElementById(
            "insightsKPICount"
        );


    if (kpiCount) {

        let count = 0;


        if (
            Array.isArray(kpiData)
        ) {

            count =
                kpiData.length;

        }
        else if (
            Array.isArray(
                kpiData.kpis
            )
        ) {

            count =
                kpiData.kpis.length;

        }
        else if (
            typeof kpiData ===
            "object"
        ) {

            count =
                Number(
                    kpiData.total_kpis ||
                    kpiData.count ||
                    0
                );

        }


        kpiCount.textContent =
            count.toLocaleString();

    }


    const domainElement =
        document.getElementById(
            "insightsDomains"
        );


    if (domainElement) {

        domainElement.textContent =
            domains.length
                ? domains.join(", ")
                : "General Analytics";

    }
}


// =========================================================
// BUSINESS INSIGHTS LIST
// =========================================================

function renderInsightList(
    insights
) {

    const container =
        document.getElementById(
            "businessInsightsList"
        );


    if (!container) {
        return;
    }


    // =====================================================
    // EMPTY
    // =====================================================

    if (
        !Array.isArray(insights) ||
        insights.length === 0
    ) {

        renderInsightsEmptyState();

        return;
    }


    // =====================================================
    // CLEAR
    // =====================================================

    container.innerHTML = "";


    // =====================================================
    // CREATE CARDS
    // =====================================================

    insights.forEach(
        (insight, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "ai-insight-item";


            card.style.animation =
                `insightAppear 0.35s ease ${index * 0.08}s both`;


            const text =
                typeof insight === "object"
                    ? (
                        insight.text ||
                        insight.insight ||
                        insight.description ||
                        JSON.stringify(insight)
                    )
                    : String(insight);


            card.innerHTML = `

                <div class="ai-insight-number">
                    ${index + 1}
                </div>

                <div class="ai-insight-content">

                    <div class="ai-insight-label">

                        <i class="fa-solid fa-wand-magic-sparkles"></i>

                        AI Insight

                    </div>

                    <div class="ai-insight-text">

                        ${escapeHtml(text)}

                    </div>

                    <div class="ai-insight-extra">

                        <small class="text-muted">

                            AI-generated observation based
                            on the selected dataset.

                        </small>

                    </div>

                    <div class="ai-insight-action">

                        <i class="fa-solid fa-chevron-down"></i>

                        View details

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    const expanded =
                        card.classList.toggle(
                            "expanded"
                        );


                    const action =
                        card.querySelector(
                            ".ai-insight-action"
                        );


                    if (action) {

                        action.innerHTML =
                            expanded

                                ? `
                                    <i class="fa-solid fa-chevron-up"></i>
                                    Hide details
                                  `

                                : `
                                    <i class="fa-solid fa-chevron-down"></i>
                                    View details
                                  `;

                    }

                }
            );


            container.appendChild(
                card
            );

        }
    );
}


// =========================================================
// RECOMMENDATIONS
// =========================================================

function renderRecommendationList(
    recommendations
) {

    const container =
        document.getElementById(
            "businessRecommendationsList"
        );


    if (!container) {
        return;
    }


    // =====================================================
    // EMPTY
    // =====================================================

    if (
        !Array.isArray(recommendations) ||
        recommendations.length === 0
    ) {

        renderRecommendationsEmptyState();

        return;
    }


    // =====================================================
    // CLEAR
    // =====================================================

    container.innerHTML = "";


    // =====================================================
    // CREATE
    // =====================================================

    recommendations.forEach(
        (recommendation, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "ai-recommendation-item";


            card.style.animation =
                `insightAppear 0.35s ease ${index * 0.08}s both`;


            const text =
                typeof recommendation === "object"
                    ? (
                        recommendation.text ||
                        recommendation.recommendation ||
                        recommendation.description ||
                        JSON.stringify(recommendation)
                    )
                    : String(recommendation);


            card.innerHTML = `

                <div class="ai-recommendation-number">

                    ${index + 1}

                </div>

                <div class="ai-recommendation-content">

                    <div class="ai-recommendation-label">

                        <i class="fa-solid fa-lightbulb"></i>

                        AI Recommendation

                    </div>

                    <div class="ai-recommendation-text">

                        ${escapeHtml(text)}

                    </div>

                    <div class="ai-recommendation-extra">

                        <small class="text-muted">

                            Recommended action generated
                            from the selected dataset.

                        </small>

                    </div>

                    <div class="ai-recommendation-action">

                        <i class="fa-solid fa-arrow-right"></i>

                        View action

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    const expanded =
                        card.classList.toggle(
                            "expanded"
                        );


                    const action =
                        card.querySelector(
                            ".ai-recommendation-action"
                        );


                    if (action) {

                        action.innerHTML =
                            expanded

                                ? `
                                    <i class="fa-solid fa-chevron-up"></i>
                                    Hide action
                                  `

                                : `
                                    <i class="fa-solid fa-arrow-right"></i>
                                    View action
                                  `;

                    }

                }
            );


            container.appendChild(
                card
            );

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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Initializing AI Business Insights..."
        );


        const button =
            document.getElementById(
                "refreshInsightsButton"
            );


        if (button) {

            button.addEventListener(
                "click",
                () => {

                    loadBusinessInsights();

                }
            );


            console.log(
                "AI Insights refresh button connected."
            );

        }


        // =================================================
        // KPI SELECTOR CHANGE
        // =================================================

        const kpiSelector =
            document.getElementById(
                "kpiFileSelector"
            );


        if (kpiSelector) {

            kpiSelector.addEventListener(
                "change",
                () => {

                    const fileId =
                        kpiSelector.value;


                    if (!fileId) {
                        return;
                    }


                    localStorage.setItem(
                        "selected_file_id",
                        fileId
                    );


                    console.log(
                        "AI Insights dataset changed:",
                        fileId
                    );


                    loadBusinessInsights(
                        fileId
                    );

                }
            );

        }


        // =================================================
        // AUTO LOAD
        // =================================================

        const selectedFile =
            getSelectedInsightsFileId();


        if (selectedFile) {

            console.log(
                "Previously selected dataset found:",
                selectedFile
            );


            setTimeout(
                () => {

                    loadBusinessInsights(
                        selectedFile
                    );

                },
                700
            );

        }
        else {

            console.log(
                "No previously selected dataset."
            );

            renderInsightsEmptyState(
                "No Dataset Selected",
                "Select a dataset above to generate AI business insights."
            );

            renderRecommendationsEmptyState();

        }

    }
);


// =========================================================
// GLOBAL FUNCTIONS
// =========================================================

window.loadBusinessInsights =
    loadBusinessInsights;


window.renderBusinessInsights =
    renderBusinessInsights;


window.renderInsightList =
    renderInsightList;


window.renderRecommendationList =
    renderRecommendationList;


window.getSelectedInsightsFileId =
    getSelectedInsightsFileId;


// =========================================================
// READY
// =========================================================

console.log(
    "AI Business Insights Dashboard ready."
);