
console.log('hi')
const editorButtonClicked = () => {
  console.log("editor clicked")
  fetch("/app/openEditor", {
    // Adding method type
    method: "GET",
    
    // Adding headers to the request
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  }).then(()=>{
    window.location = '/app/openEditor'
  })
}
const searchButtonClicked = async () => {
  const searchValue = document.getElementById("search").value;
    console.log("etc")
    console.log(searchValue)
  fetch("/app/processSearch", {
    // Adding method type
    method: "POST",
    // Adding body or contents to send
    body: JSON.stringify({
      searchValue,
    }),
    // Adding headers to the request
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  })
    .then((data) => data.json())
    .then((response) => {
      if(response.success === 1) {
        document.getElementById('mainData').innerHTML = response.data[0].data
              }
    });
};
