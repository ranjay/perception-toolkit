# Custom Artifact Store Demo

This demo showcases how to create your own Artifact Store.  One common reason is to use a cloud artifact service.

By default, the Perception Toolkit will load ARArtifacts via JSON-LD markup from pages on your site, [configured via `artifactSources`](../simple).

While this is convenient, it could be costly if you have many/large pages which are not already cached.  Instead, you can either:

* load all ARArtifacts at once, [using an Artifact Map](../artifact-map), or
* create your own artifact store, which manages artifacts however you want (as we do in this demo)

## Instructions

1. Print the product images from the [product pages](./products).
2. Run `npm run build && npm run serve`
3. Open [`https://localhost:8080/demo/custom-artifact-store/index.html`](https://localhost:8080/demo/custom-artifact-store/index.html)
4. Scan a barcode.

## How does it work?

1. Dig in to the script on [`index.html`](./index.html) to see how the `PerceptionToolkit` is created, and
2. Take look at how there is a very simple `CustomArtifactStore` defined, which tells the Perception Toolkit which ARArtifacts are relevant, based on Markers, Geo, or Images currently in the camera.
3. Finally, see how that custom artifact store is added using the `artifactStores` config property.