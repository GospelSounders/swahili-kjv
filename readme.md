# swahili-kjv CLI

A CLI for swahili-kjv. You can use it to translate KJV to swahili.

## Available Actions

**Please be sure to first run `sudo mkdir -p /usr/share/swahili-kjv/data` and assign the proper permissions. Otherwise commands which write to that directory will fail.**

1. Downloading KJV Bible

This can be done either by downloading a sword module and putting into a database or by importing the existing database with the kjv text.

in the first case

```
download [-f overwrite existing database] [-h host -u username -p password] -d dialect (mariadb/sqlite). Defaults to chapter which is the slowest way of doing it and works well on sqlite.
```

eg `swahili-kjv download -m KJV -u user -d mariadb -p password`

2. Listing

You can list books, chapters in books, verses in chapters.

To list books: `list`

To list chapters in a book: `list shortBookName`

To list verses in chapter: `list shortBookName chapter`

3. Translating

```
translate [-b book -c chapter -v verse]
```