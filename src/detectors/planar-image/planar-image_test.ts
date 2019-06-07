/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { assert } = chai;

import {
  addDetectionTarget,
  detectPlanarImages,
  removeDetectionTarget,
  reset,
  getTarget
} from './planar-image.js';

async function loadDataFile() {
  const response = await fetch('/base/test-assets/lighthouse.pb');
  return await response.arrayBuffer();
}

async function loadImageAsImageData() {
  const response = await fetch('/base/test-assets/lighthouse.jpg');
  const data = await response.blob();
  const bitmap = await createImageBitmap(data);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 640;
  canvas.height = 480;
  ctx.fillRect(0, 0, 640, 480);
  ctx.drawImage(bitmap, 100, 100, 325, 213);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const imageData = loadImageAsImageData();

describe('Planar Image Detector', () => {
  afterEach(() => {
    reset();
  });

  it('adds, removes, and detects images', async () => {
    const data = await loadDataFile();
    const src = { id: 'Lighthouse', media: [] };
    const id = await addDetectionTarget(new Uint8Array(data), src);

    const detections = await detectPlanarImages(await imageData, { root: '/base' });
    assert.equal(detections.length, 1);
    assert.equal(detections[0].value, 'Lighthouse');
    await removeDetectionTarget(id);

    const postRemovalDetections = await detectPlanarImages(await imageData, { root: '/base' });
    assert.equal(postRemovalDetections.length, 0);
  });

  it('gets targets', async () => {
    const data = await loadDataFile();
    const src = { id: 'Lighthouse', media: [] };
    await addDetectionTarget(new Uint8Array(data), src);
    const image = await getTarget('Lighthouse');
    assert.equal(image.id, 'Lighthouse');
  });
});
