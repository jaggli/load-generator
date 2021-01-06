# load-generator

A simple http(s) load generator

## Simple usage

Continously call an URL
```bash
npx load-generator http://www.example.com/
```

## CLI options
```
--url string[]        URLs containing optional placeholders. A placeholder must be in curly
                      brackets and will be filled with the corresponding values in the named values
                      option. This is the default option so the name --url may be ommited for
                      readability, also works with multiple URLs.

--values string[]     Named value lists for placeholders in the URLs. Must follow the following
                      name and comma-separated pattern: name=value1,value2,value3

--header string[]     HTTP header added to every request. Example to add cookies:
                      --header "name1=value1; name2:value2"

-p, --porcelain       Output in machine parseable format.

--pause ms            Pause between each request per worker in millisecons. Default: 0

-w, --workers amount  Amount of parallell requesting workers. Default: 2

--timeout ms          Request timeout in milliseconds, set 0 to use system default. Default: 3000

-h, --help            Display help text.
```

## Usage with config file
**1.)** Create a configuration file, and save it as `load-generator.json`

```json
{
  "pause": 500,
  "workers": 2,
  "urls": [
    "http://www.example.com/{lang}/",
    "http://www.example.com/{lang}/?sort={sort}&page={page}"
  ],
  "values": {
    "lang": ["de", "fr", "it", "en"],
    "sort": ["1", "2", "3", "4", "5", "7", "8", "10"],
    "page": ["1", "2", "3", "4", "5", "7", "8", "10"]
  },
  "headers": {
    "cookie": "accessToken=1234abc; userId=1234"
  }
}
```

One URL is picked randomly and all placeholders are replaced by random values from the value object.

**2.)** Run `npx load-generator` in the same directory.

Hint: Config file and CLI options can be combined, where CLI options always have higher priority over eqivalent config file options.

## Screenshot

![screenshot](screenshot.png)
