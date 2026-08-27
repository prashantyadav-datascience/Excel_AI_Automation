// =========================================================
// Excel AI Automation
// Dashboard JavaScript
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const token =
            localStorage.getItem(
                "access_token"
            );


        // ============================================
        // AUTHENTICATION CHECK
        // ============================================

        if (!token) {

            window.location.href =
                "/login";

            return;
        }


        // ============================================
        // USER INFORMATION
        // ============================================

        loadUserInformation();


        // ============================================
        // LOGOUT
        // ============================================

        initializeLogout();


        // ============================================
        // LOAD DASHBOARD FILES
        // ============================================

        loadDashboardData(
            token
        );


        // ============================================
        // KPI FILE SELECTOR
        // ============================================

        initializeKPIFileSelector();

    }
);


// =========================================================
// USER INFORMATION
// =========================================================

function loadUserInformation() {

    const userData =
        localStorage.getItem(
            "user"
        );

    let user = null;


    try {

        if (userData) {

            user =
                JSON.parse(
                    userData
                );

        }

    } catch (error) {

        console.error(
            "Unable to read user data:",
            error
        );

    }


    const userName =
        user?.name ||
        "User";


    const userEmail =
        user?.email ||
        "";


    // ---------------------------------------------
    // Existing ID based elements
    // ---------------------------------------------

    const userNameElement =
        document.getElementById(
            "userName"
        );


    if (userNameElement) {

        userNameElement.textContent =
            userName;

    }


    const userEmailElement =
        document.getElementById(
            "userEmail"
        );


    if (userEmailElement) {

        userEmailElement.textContent =
            userEmail;

    }


    const welcomeNameElement =
        document.getElementById(
            "welcomeName"
        );


    if (welcomeNameElement) {

        welcomeNameElement.textContent =
            userName;

    }


    // ---------------------------------------------
    // Support data attributes too
    // ---------------------------------------------

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    userNameElements.forEach(
        function (element) {

            element.textContent =
                userName;

        }
    );


    const userEmailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    userEmailElements.forEach(
        function (element) {

            element.textContent =
                userEmail;

        }
    );


    // ---------------------------------------------
    // Avatar
    // ---------------------------------------------

    const avatar =
        document.getElementById(
            "userAvatar"
        );


    if (avatar) {

        avatar.textContent =
            userName
                .charAt(0)
                .toUpperCase();

    }

}


// =========================================================
// LOGOUT
// =========================================================

function initializeLogout() {

    const logoutButtons =
        document.querySelectorAll(
            "[data-logout], #logoutButton"
        );


    logoutButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();


                    const token =
                        localStorage.getItem(
                            "access_token"
                        );


                    try {

                        if (token) {

                            await fetch(
                                "/api/auth/logout",
                                {
                                    method: "POST",

                                    headers: {
                                        "Authorization":
                                            `Bearer ${token}`
                                    }
                                }
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Logout API error:",
                            error
                        );

                    }


                    // ---------------------------------
                    // Clear authentication
                    // ---------------------------------

                    localStorage.removeItem(
                        "access_token"
                    );

                    localStorage.removeItem(
                        "user"
                    );

                    localStorage.removeItem(
                        "selected_file_id"
                    );


                    window.location.href =
                        "/login";

                }
            );

        }
    );

}


// =========================================================
// LOAD FILE STATISTICS
// =========================================================

async function loadDashboardData(
    token
) {

    try {

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


        // ---------------------------------------------
        // Authentication expired
        // ---------------------------------------------

        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );

            localStorage.removeItem(
                "selected_file_id"
            );


            window.location.href =
                "/login";

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Unable to load files."
            );

        }


        const data =
            await response.json();


        // ---------------------------------------------
        // Update dashboard statistics
        // ---------------------------------------------

        updateDashboardCards(
            data
        );


        // ---------------------------------------------
        // Populate KPI file selector
        // ---------------------------------------------

        populateKPIFileSelector(
            data.files || []
        );


        // ---------------------------------------------
        // Update recent files table
        // ---------------------------------------------

        updateRecentFilesTable(
            data.files || []
        );


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// =========================================================
// UPDATE DASHBOARD CARDS
// =========================================================

function updateDashboardCards(
    data
) {

    const files =
        data.files || [];


    const totalFiles =
        files.length;


    let totalRows = 0;

    let totalColumns = 0;


    files.forEach(
        function (file) {

            totalRows +=
                Number(
                    file.rows || 0
                );


            totalColumns +=
                Number(
                    file.columns || 0
                );

        }
    );


    // ---------------------------------------------
    // Support both old and current HTML IDs
    // ---------------------------------------------

    setCardValue(
        "totalFiles",
        totalFiles
    );


    setCardValue(
        "total-files",
        totalFiles
    );


    setCardValue(
        "totalRows",
        totalRows
    );


    setCardValue(
        "total-rows",
        totalRows
    );


    setCardValue(
        "totalColumns",
        totalColumns
    );


    setCardValue(
        "total-columns",
        totalColumns
    );

}


// =========================================================
// KPI FILE SELECTOR INITIALIZATION
// =========================================================

function initializeKPIFileSelector() {

    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (!selector) {

        console.log(
            "KPI file selector not found."
        );

        return;

    }


    selector.addEventListener(
        "change",
        function (event) {

            const fileId =
                event.target.value;


            if (!fileId) {

                return;

            }


            console.log(
                "Selected KPI file:",
                fileId
            );


            // -----------------------------------------
            // Store selected file
            // -----------------------------------------

            localStorage.setItem(
                "selected_file_id",
                fileId
            );


            // -----------------------------------------
            // Use kpi.js integration
            // -----------------------------------------

            if (
                typeof setSelectedFile ===
                "function"
            ) {

                setSelectedFile(
                    fileId
                );

            } else {

                console.error(
                    "setSelectedFile() is not available."
                );

            }

        }
    );

}


// =========================================================
// POPULATE KPI FILE SELECTOR
// =========================================================

function populateKPIFileSelector(
    files
) {

    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (!selector) {

        return;

    }


    selector.innerHTML = `

        <option value="">
            Select uploaded file...
        </option>

    `;


    if (
        !files ||
        files.length === 0
    ) {

        return;

    }


    const storedFileId =
        localStorage.getItem(
            "selected_file_id"
        );


    let selectedFileExists =
        false;


    files.forEach(
        function (file) {

            // -----------------------------------------
            // Support common API field names
            // -----------------------------------------

            const fileId =
                file.id ??
                file.file_id ??
                file.fileId;


            if (
                fileId === null ||
                fileId === undefined
            ) {

                return;

            }


            const fileName =
                file.filename ||
                file.file_name ||
                file.name ||
                `Dataset ${fileId}`;


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(fileId);


            option.textContent =
                fileName;


            if (
                storedFileId &&
                String(fileId) ===
                String(storedFileId)
            ) {

                option.selected =
                    true;

                selectedFileExists =
                    true;

            }


            selector.appendChild(
                option
            );

        }
    );


    // ---------------------------------------------
    // If previous selection is unavailable,
    // select first available dataset
    // ---------------------------------------------

    if (
        !selectedFileExists &&
        selector.options.length > 1
    ) {

        const firstFileId =
            selector.options[1].value;


        selector.value =
            firstFileId;


        localStorage.setItem(
            "selected_file_id",
            firstFileId
        );


        // -----------------------------------------
        // Automatically load first dataset KPIs
        // -----------------------------------------

        if (
            typeof setSelectedFile ===
            "function"
        ) {

            setSelectedFile(
                firstFileId
            );

        }

    }

}


// =========================================================
// UPDATE RECENT FILES TABLE
// =========================================================

function updateRecentFilesTable(
    files
) {

    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const tableContainer =
        document.getElementById(
            "filesTableContainer"
        );


    const tableBody =
        document.getElementById(
            "filesTableBody"
        );


    if (!emptyState || !tableContainer) {

        return;

    }


    if (
        !files ||
        files.length === 0
    ) {

        emptyState.classList.remove(
            "d-none"
        );


        tableContainer.classList.add(
            "d-none"
        );


        return;

    }


    emptyState.classList.add(
        "d-none"
    );


    tableContainer.classList.remove(
        "d-none"
    );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    files.slice(
        0,
        5
    ).forEach(
        function (file) {

            const fileId =
                file.id ??
                file.file_id ??
                file.fileId;


            const fileName =
                file.filename ||
                file.file_name ||
                file.name ||
                "Dataset";


            const rows =
                file.rows ||
                0;


            const columns =
                file.columns ||
                0;


            const uploaded =
                file.created_at ||
                file.uploaded_at ||
                file.uploaded ||
                "-";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    📄
                    ${escapeDashboardHTML(fileName)}
                </td>

                <td>
                    ${Number(rows).toLocaleString("en-IN")}
                </td>

                <td>
                    ${Number(columns).toLocaleString("en-IN")}
                </td>

                <td>
                    ${escapeDashboardHTML(uploaded)}
                </td>

                <td>

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        onclick="selectDashboardFile('${escapeDashboardHTML(fileId)}')"
                    >

                        Analyze

                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}


// =========================================================
// SELECT FILE FROM RECENT FILES
// =========================================================

function selectDashboardFile(
    fileId
) {

    if (!fileId) {

        return;

    }


    localStorage.setItem(
        "selected_file_id",
        fileId
    );


    const selector =
        document.getElementById(
            "kpiFileSelector"
        );


    if (selector) {

        selector.value =
            String(fileId);

    }


    if (
        typeof setSelectedFile ===
        "function"
    ) {

        setSelectedFile(
            fileId
        );

    } else {

        console.error(
            "setSelectedFile() is not available."
        );

    }

}


// =========================================================
// SET CARD VALUE
// =========================================================

function setCardValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            Number(value).toLocaleString(
                "en-IN"
            );

    }

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeDashboardHTML(
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