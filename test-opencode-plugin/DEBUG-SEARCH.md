# Debug search_notes

Please run these commands to help debug:

## 1. List files to see what exists

```javascript
list_notes();
```

## 2. Read the docs/api.md file to see its content

```javascript
read_note({ path: 'docs/api.md' });
```

## 3. Try searching for "Test" (which should be in TESTING.md)

```javascript
search_notes({ query: 'Test' });
```

## 4. Try searching for "Batch" (which should be in batch test files)

```javascript
search_notes({ query: 'Batch' });
```

Please run all 4 commands and report what you find!
