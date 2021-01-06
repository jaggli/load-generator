const commandLineUsage = require("command-line-usage");

const printHelp = (optionList) => {
  console.log(
    commandLineUsage([
      {
        header: "load-generator",
        content: "A simple http(s) load generator",
      },
      {
        header: "Synopsis",
        content: [
          "$ load-generator {bold --values lang=en,es,de} {underline https://example.com/{bold \\{lang\\}}/product/1}",
          '$ load-generator -p --header "cookie=name1:value1;" {underline https://example.com/}',
          "$ load-generator {bold --help}",
        ],
      },
      {
        header: "Options",
        optionList,
      },
      {
        content:
          "Project home: {underline https://github.com/jaggli/load-generator}",
      },
    ])
  );
};

module.exports = printHelp;
