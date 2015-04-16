import Failure from "./failure"
import {style, inline} from "../src/model"
import {applyTransform, invertTransform} from "../src/transform"

export function cmpNode(a, b, comment) {
  function raise(msg, path) {
    throw new Failure(msg + " at " + path + "\n in " + a + "\n vs " + b + (comment ? " (" + comment + ")" : ""))
  }
  function inner(a, b, path) {
    if (a.type != b.type) raise("types differ", path)
    if (a.content.length != b.content.length) raise("different content length", path)
    for (var name in b.attrs) {
      if (!(name in a.attrs) && b.attrs[name])
        raise("missing attr " + name + " on left", path)
      if (a.attrs[name] != b.attrs[name])
        raise("attribute " + name + " mismatched -- " + a.attrs[name] + " vs " + b.attrs[name], path)
    }
    for (var name in a.attrs)
      if (!(name in b.attrs) && a.attrs[name])
        raise("missing attr " + name + " on right", path)
    if (a.type.type == "inline") {
      if (a.text != b.text) raise("different text", path)
      if (!style.sameSet(a.styles, b.styles)) raise("different styles", path)
    }
    for (var i = 0; i < a.content.length; i++)
      inner(a.content[i], b.content[i], path + "." + i)
  }
  inner(a, b, "doc")
}

export function cmpStr(a, b, comment) {
  let as = a.toString(), bs = b.toString()
  if (as != bs)
    throw new Failure("expected " + bs + ", got " + as + (comment ? " (" + comment + ")" : ""))
}

export function testTransform(doc, expect, params) {
  let orig = doc.toString()
  let result = applyTransform(doc, params)
  let inverse = invertTransform(result, params)
  cmpNode(result.doc, expect)
  cmpStr(doc, orig, "immutable")
  for (let pos in expect.tag) {
    let offset, mapped = result.map(doc.tag[pos], p => offset = p)
    cmpStr(mapped, expect.tag[pos], pos)
    cmpStr(result.mapBack(mapped, offset), doc.tag[pos], pos + " back")
  }
  let invertedResult = applyTransform(result.doc, inverse)
  cmpNode(invertedResult.doc, doc, "inverse")
}
