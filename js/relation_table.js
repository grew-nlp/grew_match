let searchParams = new URLSearchParams(window.location.search)

function run(corpus, rel, gov, dep) {
  let top = searchParams.get('top')
  if (top == null) {
    alert("This page cannot be used without a `top` GET argument in the URL")
  } else {
    let url = top + "?corpus=" + corpus + "&relation=" + rel;
    if (gov != undefined) {
      url += "&source=" + gov;
    }
    if (dep != undefined) {
      url += "&target=" + dep;
    }
    window.open(url, "_blank");
  }
}
