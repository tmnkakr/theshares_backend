async function submitButtonClicked() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const first_name = document.getElementById("first_name").value;
  const last_name = document.getElementById("last_name").value;
  const phone = document.getElementById("phone").value;
  const dob = document.getElementById("dob").value;
  fetch("/app/register", {
    // Adding method type
    method: "POST",
    // Adding body or contents to send
    body: JSON.stringify({
      email,
      password,
      first_name,
      last_name,
      phone,
      dob,
    }),
    // Adding headers to the request
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  })
    .then((data) => data.json())
    .then((response) => {
      console.log(response);
    });
}
