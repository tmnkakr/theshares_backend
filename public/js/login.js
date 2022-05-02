console.log("reached");
const submitButtonClicked = () => {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  fetch("/app/login", {
    // Adding method type
    method: "POST",
    // Adding body or contents to send
    body: JSON.stringify({
      email,
      password,
    }),
    // Adding headers to the request
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  })
    .then((data) => data.json())
    .then((response) => {
      console.log(response)
    if(response.success === 1) window.location = '/app/dashboard'
    });
};
