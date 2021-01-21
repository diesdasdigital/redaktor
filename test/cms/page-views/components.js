module.exports = (page) =>
  page.data.default.components
    .map((component) => {
      const systemComponentTypes = ["headline", "paragraph"];

      try {
        const componentView = require(`../components/${component.type}/view.js`);
        return componentView(component.data);
      } catch (error) {
        if (!systemComponentTypes.includes(component.type)) {
          return `<pre>error rendering custom component ${component.type}: ${error}</pre>`;
        }
      }

      try {
        const componentView = require(`../system/components/${component.type}/view.js`);
        return componentView(component.data);
      } catch (systemComponentError) {
        return `<pre>error rendering component ${component.type}: ${error}</pre>`;
      }
    })
    .join("\n  ");
