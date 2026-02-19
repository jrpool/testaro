# actSpecs

## Introduction to the `actSpecs` file

The `actSpecs.js` file contains rules governing acts. The rules determine whether an act is valid.

## Rule format

The rules in `actSpecs.js` are organized into two objects, `etc` and `tools`. The `etc` object contains rules for acts of all types. The `tools` object contains additional rules that apply to some acts of type `test`, depending on the values of their `which` properties, namely which tools they perform tests of.

Here is an example of an act:

```json
{
  "type": "link",
  "which": "warming",
  "what": "article on climate change"
}
```

And here is the applicable property of the `etc` object in `actSpecs.js`:

```js
link: [
  'Click a link',
  {
    which: [true, 'string', 'hasLength', 'substring of the link text'],
    what: [false, 'string', 'hasLength', 'comment']
  }
]
```

The rule is an array with two elements: a string ('Click a link') describing the act and an object containing requirements for any act of type `link`.

The requirement `which: [true, 'string', 'hasLength', 'substring of the link text']` specifies what is required for the `which` property of a `link`-type act. The requirement is an array.

In most cases, the array has length 4:

- Item 0. Is the property (here `which`) required (`true` or `false`)? The value `true` here means that every `link`-type act **must** contain a `which` property.
- Item 1. What format must the property value have (`'string'`, `'array'`, `'boolean'`, `'number'`, or `'object'`)?
- Item 2. What other validity criterion applies (if any)? (Empty string if none.) The `hasLength` criterion means that the string must be at least 1 character long.
- Item 3. Description of the property. In this example, the description says that the value of `which` must be a substring of the text content of the link that is to be clicked. Thus, a `link` act tells Testaro to find the first link whose text content has this substring and click it.

The validity criterion named in item 2 may be any of these:

- `'hasLength'`: is not a blank string
- `'isURL`': is a string starting with `http`, `https`, or `file`, then `://`, then ending with 1 or more non-whitespace characters
- `'isBrowserType'`: is `'chromium'`, `'firefox'`, or `'webkit'`
- `'isFocusable'`: is `'a'`, `'button'`, `'input'`, `'select'`, or `'option'`
- `'isState'`: is `'loaded'` or `'idle'`
- `'isTest'`: is the name of a tool
- `'isWaitable'`: is `'url'`, `'title'`, or `'body'`
- `'areStrings'`: is an array of strings
