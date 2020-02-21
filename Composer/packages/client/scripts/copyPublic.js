const fs = require('fs-extra');
const paths = require('../config/paths');

fs.copySync(paths.appPublic, paths.appBuild, {
  dereference: true,
  filter: file => ![paths.appHtml, paths.extensionContainerHtml].includes(file),
});
