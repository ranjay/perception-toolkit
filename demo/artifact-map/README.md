# Simple Config Demo

This demo showcases how to load multiple ARArtifact definitoons into the Perception Toolkit, all at once.

By default, the Perception Toolkit will load ARArtifacts via JSON-LD markup from pages on your side, [configured via `artifactSources`](../simple).

While this is convenient, it could be costly if you have many/large pages which are not already cached.  Instead, you can either:

* [create your own artifact store](../custom-artifact-store), which manages artifacts however you want, or
* load all ARArtifacts at once, using an Artifact Map (as we do in this demo)

## Instructions

1. Print the product images from the [product pages](./products).
2. Run `npm run build && npm run serve`
3. Open [`https://localhost:8080/demo/artifact-map/index.html`](https://localhost:8080/demo/artifact-map/index.html)
4. Scan a barcode.

## How does it work?

1. First, look at this JSON+LD [`ar-artifact-map.jsonld`](./ar-artifact-map.jsonld) file, to see how a list of artifacts are defined.
2. Dig in to the script on [`index.html`](./index.html) to see how the `PerceptionToolkit` is created, and
3. Take look at how the `<script type="application/ld+json" src=...>` artifact map is embeded in the `<head>`, which tells PerceptionToolkit that there are a bunch of artifacts to look for.

Note: you can also link to Artifact Maps alongside HTML pages in `artifactSources`.