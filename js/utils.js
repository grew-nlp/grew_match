// ==================================================================================
function log(msg) {
  if (false) {  // false --> turn off logging // true --> true turn on logging
    console.log(msg)
  }
}

// ==================================================================================
async function fetch_json(url) {
  const response = await fetch(url)
  if (response.status != 200) {
    throw Error ("Cannot load: " + url)
  }
  const json_data = await response.json()
  return json_data
}

// ==================================================================================
// https://www.geeksforgeeks.org/how-to-trigger-a-file-download-when-clicking-an-html-button-or-javascript/#using-a-custom-javascript-function
function download_text(file, text) {
  var element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(text))
  element.setAttribute('download', file)
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

// ==================================================================================
function ratio(value, total) {
  return `${(value/total*100).toFixed(2)}%`
}

// ==================================================================================
const Grid_display = Object.freeze({
  SIZE: 0,
  PERCENT: 1,
  PERCENT_COL: 2,
  PERCENT_ROW: 3,
});


// ==================================================================================
function common_prefix_length(s1, s2) {
  let i = 0
  while (s1[i] == s2[i] && s1[i] != undefined) {
    i++
  }
  return (i)
}

// ==================================================================================
// taken from: https://rosettacode.org/wiki/Levenshtein_distance#JavaScript
function levenshtein(a, b) {
  let t = [],
  u, i, j, m = a.length,
  n = b.length
  if (!m) {
    return n
  }
  if (!n) {
    return m
  }
  for (j = 0; j <= n; j++) {
    t[j] = j
  }
  for (i = 1; i <= m; i++) {
    for (u = [i], j = 1; j <= n; j++) {
      u[j] = a[i - 1] === b[j - 1] ? t[j - 1] : Math.min(t[j - 1], t[j], u[j - 1]) + 1
    }
    t = u
  }
  return u[n]
}

// ==================================================================================
function SelectText(element) {
  let doc = document,
  text = doc.getElementById(element),
  range, selection
  if (doc.body.createTextRange) {
    range = document.body.createTextRange()
    range.moveToElementText(text)
    range.select()
  } else if (window.getSelection) {
    selection = window.getSelection()
    range = document.createRange()
    range.selectNodeContents(text)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

// ==================================================================================
function direct_error(msg, title="Error") {
  let html = md.render(msg)
  Swal.fire({
    icon: 'error',
    title: title,
    html: html
  })
}

// ==================================================================================
function direct_warning(msg) {
  let html = md.render(msg)
  Swal.fire({
    icon: 'warning',
    title: 'Warning',
    html: html
  })
}

// ==================================================================================
function direct_info(msg) {
  let html = md.render(msg)
  Swal.fire({
    icon: 'info',
    title: 'Info',
    html: html
  })
}

// ==================================================================================
function init_tooltips() {

  $('.tooltip-desc').tooltipster({
    contentAsHTML: true,
    theme: 'tooltipster-noir',
    interactive: true,
    position: 'bottom'
  })

  // Long HTML tooltip are defined in run.html
  $('#tf-wf-tooltip').tooltipster('content', $("#tf-wf-tip").html())
  $('#pid-tooltip').tooltipster('content', "Show names of matched nodes in the graph")
  $('#warning-tooltip').tooltipster('content', $("#warning-tip").html())

  $('#export-button').tooltipster('content', "Export the sentence text of each occurrence like in a concordancer")
  $('#save-button').tooltipster('content', "Build a permanent URL with the current session")
  $('#download-conll-button').tooltipster('content', "Download a CoNLL file with the sentences<br/>Each sentence is given only once, <br/>even if there are multiple occurrences on the request in it.")

  $('#conll-button').tooltipster('content', "Show the CoNLL code of the current dependency tree")

  $('#duplicate').tooltipster('content', "Open a new tab with the same corpus and request")
  $('#github-button').tooltipster('content', "GitHub repository")
  $('#guidelines-button').tooltipster('content', "Guidelines")
  $('#issue-button').tooltipster('content', "Report error")
  $('#link-button').tooltipster('content', "External link")
  $('#sud-valid-button').tooltipster('content', "SUD validation (new page)")
  $('#ud-valid-button').tooltipster('content', "UD validation (new page)")
  $('#table-button').tooltipster('content', "Relation tables (new page)")
  $('#para-tooltip').tooltipster('content', "Select a treebank in the list to show the same sentence in this parallel corpus. Use <i aria-hidden='true' class='fa fa fa-link'></i> to select the corpus for querying")
  $('#para-close-tooltip').tooltipster('content', "Unselect the current parallel treebank");
}
