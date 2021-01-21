module.exports = (page, view) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${page.data.en.required.title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body>
  ${view}
</body>
</html>`;
