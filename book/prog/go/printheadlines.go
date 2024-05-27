package main

import (
	"fmt"

	"github.com/mmcdole/gofeed"
)

func main() {
	fp := gofeed.NewParser()
	feed, err := fp.ParseURL("https://www.heise.de/newsticker/heise-atom.xml")
	if err != nil {
		panic(err)
	}
	for _, item := range feed.Items {
		fmt.Printf("* [%s]: %s\n",
			item.PublishedParsed.Local().Format("2006-01-02 15:04:05"),
			item.Title)
	}
}
