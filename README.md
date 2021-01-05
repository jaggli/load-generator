# load-generator

## Usage

<details><summary>
  
**Step 1** Create a configuration file, and save it as `load-generator.json`
</summary>

```json
{
  "wait": 500,
  "instances": 2,
  "urls": [
    "http://www.example.com/{lang}/",
    "http://www.example.com/{lang}/?sort={sort}&page={page}"
  ],
  "values": {
    "lang": ["de", "fr", "it", "en"],
    "sort": ["1", "2", "3", "4", "5", "7", "8", "10"],
    "page": ["1", "2", "3", "4", "5", "7", "8", "10"]
  }
}
```

One url is picked randomly and all placeholders are replaced by values from the value object.

</details>

**Step 2** Run `npx load-generator` in the same directory. The laod test imediately starts.

If you are using a old npm version prior 5.2.0, you can install the package globally

**Step 3** Hit ESC to stop the load test

## Screenshot

![screenshot](screenshot.png)
