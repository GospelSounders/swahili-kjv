# swahili-kjv CLI

A CLI for swahili-kjv. You can use it to translate KJV to swahili.

## Dependencies
 - mariadb/sqlite
 - nodejs v10+

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

3. Download Swahili Versions

Swahili versions from [bible.com](https://www.bible.com/). You can check the versions at [swahili bible versions](https://www.bible.com/json/bible/versions/swh?filter=)

1. BHN  - Biblia Habari Njema
2. BHND - Biblia Habari Njema
3. BHNTLK - Biblia Habari Njema: Toleo la Kujifunza
4. NEN - Neno: Bibilia Takatifu 2014
5. SRUV - Swahili Revised Union Version
6. SRUVDC - Swahili Revised Union Version
7. SUV - Swahili Union Version
8. TKU - Agano Jipya: Tafsiri ya Kusoma-Kwa-Urahisi

```bash
swahili-kjv downloadfrommybible -m SUV{etc}
find SUV{etc}/* -size  0 -print -delete   ## run in /usr/share/swahili-kjv/data to delete zero size files in downloaded folder
swahili-kjv download -m SUV{etc} ## download missing files (if any)
```

4. extract from downloaded Swahili Versions

If the downloaded pages in ***3*** are very big, you may have moved them to a different drive. In that case remember to supply the path as below

```bash
swahili-kjv extractfrommybible -m BHN -f "/path/to/dir/containing/downloaded/bibles" -u user -p password -d mariadb
```

Else you can ignore the path, as:

```bash
swahili-kjv extractfrommybible -m BHN -u user -p password -d mariadb
```


5. Translating

```
translate [-b book -c chapter -v verse -u user -p password -d dialect]
```

.