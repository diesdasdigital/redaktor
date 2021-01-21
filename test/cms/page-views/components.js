module.exports = (page) =>
  page.data.default.components
    .map((component) => {
      const componentView = require(`../system/components/${component.type}`);
      return componentView(component);
    })
    .join("\n  ");
