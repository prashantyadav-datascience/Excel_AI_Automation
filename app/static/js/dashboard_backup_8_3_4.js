document.addEventListener("DOMContentLoaded", function () {

    const token =
        localStorage.getItem("access_token");


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

    const userData =
        localStorage.getItem("user");

    let user = null;

    try {

        if (userData) {
            user =
                JSON.parse(userData);
        }

    } catch (error) {

        console.error(
            "Unable to read user data:",
            error
        );

    }


    // ============================================
    // DISPLAY USER NAME
    // ============================================

    const userNameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    userNameElements.forEach(
        function (element) {

            element.textContent =
                user?.name || "User";

        }
    );


    // ============================================
    // DISPLAY USER EMAIL
    // ============================================

    const userEmailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    userEmailElements.forEach(
        function (element) {

            element.textContent =
                user?.email || "";

        }
    );


    // ============================================
    // LOGOUT
    // ============================================

    const logoutButtons =
        document.querySelectorAll(
            "[data-logout]"
        );


    logoutButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();


                    try {

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

                    } catch (error) {

                        console.error(
                            "Logout API error:",
                            error
                        );

                    }


                    // Clear authentication

                    localStorage.removeItem(
                        "access_token"
                    );

                    localStorage.removeItem(
                        "user"
                    );


                    window.location.href =
                        "/login";

                }
            );

        }
    );


    // ============================================
    // LOAD FILE STATISTICS
    // ============================================

    loadDashboardData(token);

});


async function loadDashboardData(token) {

    try {

        const response = await fetch(
            "/api/files",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
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


        updateDashboardCards(
            data
        );


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


function updateDashboardCards(data) {

    const files =
        data.files || [];


    let totalFiles =
        files.length;

    let totalRows = 0;

    let totalColumns = 0;


    files.forEach(
        function (file) {

            totalRows +=
                Number(file.rows || 0);

            totalColumns +=
                Number(file.columns || 0);

        }
    );


    setCardValue(
        "total-files",
        totalFiles
    );

    setCardValue(
        "total-rows",
        totalRows
    );

    setCardValue(
        "total-columns",
        totalColumns
    );

}


function setCardValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}