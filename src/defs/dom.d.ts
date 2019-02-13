/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

interface Document {
  fullscreenElement: null | HTMLElement;
}

interface HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

interface Window {
  BarcodeDetector: typeof BarcodeDetector
}

interface Event {
  path: Element[];
}

declare function importScripts(...urls: string[]): void;