import * as fs from "fs";
// import * as xmldoc from "xmldoc";
const xmldoc = require("xmldoc");
import * as http from "http";

export namespace FeedParser {
    export function identify(xmlString: string) {
        return (/<(rss|rdf)\b/i.test(xmlString) ? "rss" : (/<feed\b/i.test(xmlString) ? "atom" : false))
    }

    export function parse(xmlString: string) {
        const identified = identify(xmlString);
        return identified ? FeedParser[identified as string](xmlString) : null;
    }

    export function rss(xmlString: string): Article[] {
        const articles: Article[] = [];
        new xmldoc.XmlDocument(xmlString).childNamed("channel").childrenNamed("item").forEach(item => {
            const article: Article = {
                id: item.valueWithPath("guid") || item.valueWithPath("link"),
                title: item.valueWithPath("title"),
                content: item.valueWithPath("description"),
                link: item.valueWithPath("link"),
                date: item.valueWithPath("pubDate") || item.valueWithPath("lastBuildDate") || new Date().toString()
            };
            articles[articles.length] = article;
        });

        return articles;
    }

    export function atom(xmlString: string): Article[] {
        const articles: Article[] = [];

        new xmldoc.XmlDocument(xmlString).childrenNamed("entry").forEach(item => {
            articles[articles.length] = {
                id: item.valueWithPath("id"),
                title: item.valueWithPath("title"),
                content: item.valueWithPath("summary") || item.valueWithPath("content") || item.valueWithPath("subtitle"),
                link: /href="(.+)"/.exec(item.childWithAttribute("href").toString())[1],
                date: item.valueWithPath("published") || item.valueWithPath("updated") || new Date().toString()
            };
        });

        return articles;
    }

    interface Article {
        id: string;
        title: string;
        content: string;
        link: string;
        date: string;
    }
}

console.log(FeedParser.parse(fs.readFileSync("atom.xml").toString("utf-8")));