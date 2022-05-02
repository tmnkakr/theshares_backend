const mainWritingArea = document.getElementById("mainWritingArea");
let articleInArrayForm = [];
currentTextFieldNumber = 0;
function OnInput() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
}
function addTextField() {
  currentTextFieldNumber += 1;
  const textField = new DOMParser().parseFromString(
    `

  <div>
  <div class='utilitytrayouter'>
  <center>
  <div class='utilitytray'>
  <button>
  <i class="material-icons md-18">article</i>
  </button>
  <button>
  <i class="material-icons md-18">image</i>
  </button>
  <button>
  <i class="material-icons md-18">movie</i>
  </button>
  </div>
  </center>
  </div>
  <textarea class='text' id=textfield${currentTextFieldNumber}></textarea>
  </div>
  `,
    "text/html"
  );
  if (mainWritingArea.innerHTML.length === 0) {
    articleInArrayForm.push(textField);
    mainWritingArea.appendChild(textField.firstChild);
  } else {
    articleInArrayForm.push("#####");
    articleInArrayForm.push(textField);
    mainWritingArea.appendChild(textField.firstChild);
  }

  const currentTextField = document.getElementById(
    `textfield${currentTextFieldNumber}`
  );

  currentTextField.setAttribute(
    "style",
    "height:" + currentTextField.scrollHeight + "px;overflow-y:hidden;"
  );
  currentTextField.addEventListener("input", OnInput, false);
  console.log(articleInArrayForm);
}

function clickme() {
  for (let i = 0; i < mainWritingArea.children.length; i++) {
    console.log(
      mainWritingArea.children[i].lastChild.firstChild.firstChild.value
    );
  }
}
