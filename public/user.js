document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const sLogin = document.getElementById("s-login");
  const sSignup = document.getElementById("s-signup");

  if (sLogin) {
    sLogin.addEventListener("click", () => {
      console.log("click");
      window.location.href = "/user/login";
    });
  }
  if (sSignup) {
    sSignup.addEventListener("click", () => {
      window.location.href = "/user/signup";
      console.log("click");
    });
  }
  if (document.getElementById("loginForm")) {
    document
      .getElementById("loginForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        console.log("Sending data:", { email, password });
        axios
          .post("/api/login", {
            email,
            password,
          })
          .then((response) => {
            console.log("Response data:", response.data);
            if (response.data.status === "success") {
              const userId = response.data.user._id;
              if (!userId) alert("no valid entry");
              socket.emit("new user", userId);
              window.location.href = "/chat";
            } else {
              alert("Invalid login. Please try again.");
            }
          })
          .catch((error) => {
            if (error.response) {
              console.error("Error response:", error.response.data);
              alert("Invalid login. Please try again.");
            } else {
              console.error("Error:", error.message);
              alert("Something went wrong. Please try again.");
            }
          });
      });
  }
  if (document.getElementById("signupForm")) {
    document
      .getElementById("signupForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const user_name = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document
          .getElementById("confirmPassword")
          .value.trim();
        const name = document.getElementById("name").value.trim();
        console.log(email);
        axios
          .post("/api/signup", {
            email,
            password,
            name,
            user_name,
            confirmPassword,
          })
          .then((response) => {
            console.log("Response data:", response.data);
            if (response.data.status === "success") {
              window.location.href = "/home";
            } else {
              alert("Invalid Details. Please try again.");
            }
          })
          .catch((error) => {
            if (error.response) {
              console.error("Error response:", error.response.data);
              alert("Invalid login. Please try again.");
            } else {
              console.error("Error:", error.message);
              alert("Something went wrong. Please try again.");
            }
          });
      });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementById("login");
  const signup = document.getElementById("signup");
  const start = document.getElementById("start");
  if (login) {
    login.addEventListener("click", () => {
      window.location.href = "/user/login";
    });
  }
  if (signup) {
    signup.addEventListener("click", () => {
      window.location.href = "/user/signup";
    });
  }
  if (start) {
    start.addEventListener("click", () => {
      window.location.href = "/user/login";
    });
  }
});
