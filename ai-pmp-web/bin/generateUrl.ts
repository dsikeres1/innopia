import path from "path";
import fs, {readFileSync} from "fs";
import {isNotBlank, removeSuffix} from "../ex/ex";
import {head} from "lodash";
import prettier from "prettier";
import {isNotNil} from "../ex/lodashEx";

export {};

type Page = {
  kind: "page";
  readonly name: string;
  readonly query?: string;
};

type Dir = {
  kind: "dir";
  readonly name: string;
  readonly children: Array<Page | Dir>;
};

function parseSource(parentDir: string): Array<Page | Dir> {
  const entries = fs.readdirSync(parentDir, { withFileTypes: true });
  const contents = Array<Page | Dir>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) {
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.startsWith("_")) {
      const tsx = readFileSync(path.join(parentDir, entry.name), {
        encoding: "utf8",
      })
        .split("\n")

        .filter((line) => !line.trim().startsWith("//"))
        .join("\n");
      const queries: RegExpMatchArray[] = Array.from(
        tsx.matchAll(/const Query = defineQuery\((\{[^}]*})\);/g),
      );
      if (queries.length > 1) {
        throw new Error(
          `Query 가 두 번 정의되어 있습니다. : file=${path.join(parentDir, entry.name)}`,
        );
      }
      const query = Array.from(head(queries) ?? Array<string>())[1];
      contents.push({
        kind: "page",
        name: removeSuffix(entry.name, ".tsx"),
        query,
      });
      continue;
    }

    if (entry.isDirectory()) {
      const children = parseSource(path.join(parentDir, entry.name));
      if (isNotBlank(children)) {
        contents.push({ kind: "dir", name: entry.name, children });
      }
    }
  }

  return contents;
}

function generateSources(pages: Array<Page | Dir>, parents: string[]): string[] {
  return pages.flatMap((page) => generateSource(page, parents));
}

function generateSource(page: Page | Dir, parents: string[]): string[] {
  const lines = Array<string>();
  const newParents = [...parents, page.name === "index" ? "" : page.name];
  switch (page.kind) {
    case "page": {
      const pathname = `/${newParents.join("/")}`;
      const key = `"${page.name}"`;
      if (isNotNil(page.query)) {
        lines.push(`${key}: new PageQueryUrl("${pathname}", defineQuery(${page.query})),`);
      } else {
        lines.push(`${key}: new PageUrl("${pathname}"),`);
      }
      break;
    }
    case "dir":
    default: {
      lines.push(`${page.name} : {`);
      lines.push(...generateSources(page.children, newParents));
      lines.push("},");
      break;
    }
  }

  return lines;
}

const pagesDir = path.join(__dirname, "..", "/src", "pages");
const pages = parseSource(pagesDir);

const ts = Array<string>();
ts.push("/* tslint:disable */");
ts.push("/* eslint-disable */");
ts.push(`// 자동 생성 파일 수정하지 말것 ${new Date().toString()}`);
ts.push('import { PageUrl, PageQueryUrl } from "./url";');
ts.push(
  'import {defineQuery, cInt, cNat, cString, cStringUnion, cPk, cMoment, cBool, cType} from "../../ex/query";',
);
ts.push("export const Urls = {");
ts.push(...generateSources(pages, []));
ts.push("};");

const targetPath = path.join(__dirname, "..", "src/url/url.g.ts");
const tsFormatted = prettier.format(ts.join("\n"), { filepath: targetPath }).then((formatted) => {
  fs.writeFileSync(targetPath, formatted);
});