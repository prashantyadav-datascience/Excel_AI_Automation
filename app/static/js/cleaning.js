// =========================================================
// CLEANING PAGE
// =========================================================

let currentFileId = null;


// =========================================================
// GET FILE ID
// =========================================================

function getFileId() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const urlFileId =
        urlParams.get("file_id");

    const input =
        document.getElementById("fileId");

    if (urlFileId) {

        input.value = urlFileId;

        return urlFileId;
    }

    return input.value;
}


// =========================================================
// LOAD CLEANING PROFILE
// =========================================================

async function loadCleaningProfile() {

    const fileId = getFileId();

    if (!fileId) {

        alert(
            "Please enter a File ID."
        );

        return;
    }

    currentFileId = fileId;

    const loading =
        document.getElementById("loading");

    const section =
        document.getElementById(
            "analysisSection"
        );

    loading.style.display = "block";

    section.style.display = "none";


    try {

        const response =
            await fetch(
                `/api/clean/${fileId}/profile`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to analyze dataset."
            );
        }


        displayCleaningProfile(data);

        section.style.display = "block";

    }

    catch (error) {

        alert(
            "Error: " +
            error.message
        );

    }

    finally {

        loading.style.display = "none";

    }

}


// =========================================================
// DISPLAY PROFILE
// =========================================================

function displayCleaningProfile(data) {

    document.getElementById(
        "filename"
    ).textContent =
        data.filename || "Unknown";


    // -----------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------

    const summary =
        data.summary || {};


    document.getElementById(
        "missingValues"
    ).textContent =
        summary.missing_values ??
        0;


    document.getElementById(
        "duplicateRows"
    ).textContent =
        data.duplicates?.count ??
        summary.duplicate_rows ??
        0;


    document.getElementById(
        "emptyColumns"
    ).textContent =
        data.empty_columns?.length ??
        0;


    // -----------------------------------------------------
    // IQR OUTLIERS
    // -----------------------------------------------------

    const iqrData =
        data.iqr_outliers || {};

    let iqrCount = 0;


    if (typeof iqrData === "object") {

        Object.values(iqrData)
            .forEach(value => {

                if (typeof value === "number") {

                    iqrCount += value;

                }

                else if (
                    value &&
                    typeof value.count === "number"
                ) {

                    iqrCount += value.count;

                }

            });

    }


    document.getElementById(
        "iqrOutliers"
    ).textContent =
        iqrCount;


    // -----------------------------------------------------
    // QUALITY SCORE
    // -----------------------------------------------------

    calculateQuality(
        summary,
        data
    );


    // -----------------------------------------------------
    // MISSING TABLE
    // -----------------------------------------------------

    buildMissingTable(
        data.missing_value_suggestions
    );


    // -----------------------------------------------------
    // DATA TYPES
    // -----------------------------------------------------

    buildDataTypesTable(
        data.data_types
    );


    // -----------------------------------------------------
    // OUTLIER DETAILS
    // -----------------------------------------------------

    buildOutlierDetails(
        "iqrDetails",
        data.iqr_outliers
    );

    buildOutlierDetails(
        "zscoreDetails",
        data.zscore_outliers
    );

}


// =========================================================
// QUALITY SCORE
// =========================================================

function calculateQuality(
    summary,
    data
) {

    const missing =
        Number(
            summary.missing_values || 0
        );

    const duplicates =
        Number(
            data.duplicates?.count || 0
        );

    const rows =
        Number(
            summary.rows || 0
        );


    if (rows <= 0) {

        updateQuality(0);

        return;
    }


    const missingPenalty =
        Math.min(
            40,
            (missing / rows) * 100
        );


    const duplicatePenalty =
        Math.min(
            30,
            (duplicates / rows) * 100
        );


    let quality =
        100 -
        missingPenalty -
        duplicatePenalty;


    quality =
        Math.max(
            0,
            Math.min(
                100,
                quality
            )
        );


    updateQuality(
        Math.round(quality)
    );

}


// =========================================================
// UPDATE QUALITY BAR
// =========================================================

function updateQuality(score) {

    document.getElementById(
        "qualityProgress"
    ).style.width =
        `${score}%`;


    document.getElementById(
        "qualityText"
    ).textContent =
        `${score}% Data Quality`;

}


// =========================================================
// MISSING VALUE TABLE
// =========================================================

function buildMissingTable(data) {

    const table =
        document.getElementById(
            "missingTable"
        );

    table.innerHTML = "";


    if (!data) {

        table.innerHTML =
            `<tr>
                <td colspan="3">
                    No missing value information.
                </td>
            </tr>`;

        return;
    }


    if (Array.isArray(data)) {

        data.forEach(item => {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${item.column || "-"}
                </td>

                <td>
                    ${item.missing_count ??
                      item.count ??
                      0}
                </td>

                <td>
                    ${item.suggested_method ||
                      item.method ||
                      "-"}
                </td>
            `;

            table.appendChild(row);

        });

        return;
    }


    Object.entries(data)
        .forEach(
            ([column, value]) => {

                let missingCount = 0;

                let method = "-";


                if (
                    typeof value === "object" &&
                    value !== null
                ) {

                    missingCount =
                        value.missing_count ??
                        value.count ??
                        0;

                    method =
                        value.method ??
                        value.suggested_method ??
                        "-";

                }

                else {

                    method = String(value);

                }


                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>${column}</td>

                    <td>
                        ${missingCount}
                    </td>

                    <td>
                        ${method}
                    </td>
                `;

                table.appendChild(row);

            }
        );

}


// =========================================================
// DATA TYPES TABLE
// =========================================================

function buildDataTypesTable(data) {

    const table =
        document.getElementById(
            "dataTypesTable"
        );

    table.innerHTML = "";


    if (!data) {

        table.innerHTML =
            `<tr>
                <td colspan="2">
                    No data type information.
                </td>
            </tr>`;

        return;
    }


    Object.entries(data)
        .forEach(
            ([column, type]) => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        ${column}
                    </td>

                    <td>
                        <span class="badge bg-secondary">
                            ${type}
                        </span>
                    </td>
                `;

                table.appendChild(row);

            }
        );

}


// =========================================================
// OUTLIER DETAILS
// =========================================================

function buildOutlierDetails(
    elementId,
    data
) {

    const element =
        document.getElementById(
            elementId
        );

    element.innerHTML = "";


    if (!data) {

        element.textContent =
            "No outliers detected.";

        return;
    }


    if (
        typeof data === "object"
    ) {

        const entries =
            Object.entries(data);


        if (entries.length === 0) {

            element.textContent =
                "No outliers detected.";

            return;
        }


        entries.forEach(
            ([column, value]) => {

                const div =
                    document.createElement(
                        "div"
                    );

                let count = value;


                if (
                    value &&
                    typeof value === "object"
                ) {

                    count =
                        value.count ??
                        value.outliers ??
                        0;

                }


                div.textContent =
                    `${column}: ${count}`;

                element.appendChild(div);

            }
        );

    }

    else {

        element.textContent =
            String(data);

    }

}


// =========================================================
// AUTO CLEAN
// =========================================================

async function autoCleanDataset() {

    if (!currentFileId) {

        currentFileId =
            getFileId();

    }


    if (!currentFileId) {

        alert(
            "Please select a dataset first."
        );

        return;
    }


    const button =
        document.getElementById(
            "autoCleanButton"
        );


    const originalText =
        button.innerHTML;


    button.disabled = true;

    button.innerHTML =
        "⏳ Cleaning...";


    try {

        const response =
            await fetch(
                `/api/clean/${currentFileId}/auto`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Cleaning failed."
            );

        }


        document.getElementById(
            "cleanResult"
        ).style.display =
            "block";


        document.getElementById(
            "cleanMessage"
        ).textContent =
            data.message ||
            "Dataset cleaned successfully.";


        const downloadButton =
            document.getElementById(
                "downloadButton"
            );


        downloadButton.href =
            data.download_url;


        // Reload profile
        await loadCleaningProfile();


    }

    catch (error) {

        alert(
            "Cleaning Error: " +
            error.message
        );

    }

    finally {

        button.disabled = false;

        button.innerHTML =
            originalText;

    }

}


// =========================================================
// LOGOUT
// =========================================================

function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "/login";

}


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const fileId =
            getFileId();

        if (fileId) {

            currentFileId =
                fileId;

            loadCleaningProfile();

        }

    }
);