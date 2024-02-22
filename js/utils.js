// ==================================================================================
// https://www.geeksforgeeks.org/how-to-trigger-a-file-download-when-clicking-an-html-button-or-javascript/#using-a-custom-javascript-function
function download_text(file, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(text));
  element.setAttribute('download', file);
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// ==================================================================================
function common_prefix_length(s1, s2) {
  let i = 0;
  while (s1[i] == s2[i] && s1[i] != undefined) {
    i++;
  }
  return (i);
}

// ==================================================================================
// taken from: https://rosettacode.org/wiki/Levenshtein_distance#JavaScript
function levenshtein(a, b) {
  let t = [],
    u, i, j, m = a.length,
    n = b.length;
  if (!m) {
    return n;
  }
  if (!n) {
    return m;
  }
  for (j = 0; j <= n; j++) {
    t[j] = j;
  }
  for (i = 1; i <= m; i++) {
    for (u = [i], j = 1; j <= n; j++) {
      u[j] = a[i - 1] === b[j - 1] ? t[j - 1] : Math.min(t[j - 1], t[j], u[j - 1]) + 1;
    }
    t = u;
  }
  return u[n];
}

// ==================================================================================
function SelectText(element) {
  let doc = document,
    text = doc.getElementById(element),
    range, selection;
  if (doc.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToElementText(text);
    range.select();
  } else if (window.getSelection) {
    selection = window.getSelection();
    range = document.createRange();
    range.selectNodeContents(text);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// ==================================================================================
function direct_error(msg) {
  let html = md.render(msg)
  Swal.fire({
    icon: 'error',
    title: 'Error',
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
