document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    const loginButton = document.getElementById("loginButton");
    const loginText = document.getElementById("loginText");
    const loginSpinner = document.getElementById("loginSpinner");
    const messageBox = document.getElementById("messageBox");


    function showMessage(message, type = "danger") {

        if (!messageBox) {
            alert(message);
            return;
        }

        messageBox.className = `alert alert-${type}`;
        messageBox.textContent = message;
        messageBox.classList.remove("d-none");
    }


    function hideMessage() {

        if (!messageBox) {
            return;
        }

        messageBox.classList.add("d-none");
        messageBox.textContent = "";
    }


    function setLoading(loading) {

        if (loginButton) {
            loginButton.disabled = loading;
        }

        if (loginText) {
            loginText.classList.toggle(
                "d-none",
                loading
            );
        }

        if (loginSpinner) {
            loginSpinner.classList.toggle(
                "d-none",
                !loading
            );
        }
    }


    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideMessage();

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!email || !password) {

                showMessage(
                    "Please enter email and password."
                );

                return;
            }


            setLoading(true);


            try {

                const response = await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


                const data =
                    await response.json();


                if (!response.ok) {

                    let errorMessage =
                        "Login failed.";

                    if (data.detail) {

                        if (Array.isArray(data.detail)) {

                            errorMessage =
                                data.detail
                                    .map(
                                        item =>
                                            item.msg
                                    )
                                    .join(", ");

                        } else {

                            errorMessage =
                                data.detail;
                        }
                    }

                    throw new Error(
                        errorMessage
                    );
                }


                if (
                    !data.access_token
                ) {

                    throw new Error(
                        "Login successful but authentication token was not received."
                    );
                }


                // =====================================
                // SAVE JWT
                // =====================================

                localStorage.setItem(
                    "access_token",
                    data.access_token
                );


                // =====================================
                // SAVE USER INFORMATION
                // =====================================

                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            data.user
                        )
                    );
                }


                showMessage(
                    "Login successful. Redirecting...",
                    "success"
                );


                // =====================================
                // REDIRECT
                // =====================================

                setTimeout(
                    function () {

                        window.location.href =
                            "/dashboard";

                    },
                    500
                );

            }

            catch (error) {

                console.error(
                    "Login Error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to login. Please try again."
                );

            }

            finally {

                setLoading(false);

            }

        }
    );

});