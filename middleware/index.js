const fs = require("fs-extra");
const { optionsEJS } = require("../helper");
const { user: userControllers } = require("../controllers");
module.exports = async function ({ app, sql }) {
  const routesDir = await fs.readdir("./routes");
  await Promise.all(
    routesDir.map(async (routeDir) => {
      const isDirectory = (await fs.pathExists(`./routes/${routeDir}`)) && (await fs.lstat(`./routes/${routeDir}`)).isDirectory();
      if (isDirectory) {
        const files = await fs.readdir(`./routes/${routeDir}`);
        await Promise.all(
          files.map(async (file) => {
            if (file.split(".")[1] !== "js") return;
            try {
              const route = require(`../routes/${routeDir}/${file}`);
              const middleware = Array.isArray(route.middleware) && route.middleware.length > 0 ? route.middleware : [];
              app[route.method.toLowerCase()](`/${route.name.toLowerCase()}`, middleware, async(req, res, next) => {
                var options = optionsEJS(req, res);
                try {
                  await route.run({ req, res, sql, options, user: await userControllers(req, res, next), next });
                } catch (error) {
                  next(error);
                }
              });
              console.log(`Load thành công routes : ${file}`);
            } catch (error) {
              console.error(`Không thể load routes : ${file} vì lỗi - ${error}`);
            }
          })
        );
      }
    })
  );
};
