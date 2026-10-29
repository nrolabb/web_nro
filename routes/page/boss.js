module.exports = {
    name: "boss",
    method: "GET",
    middleware: [],
    run: ({ res }) => res.redirect("/"),
};
