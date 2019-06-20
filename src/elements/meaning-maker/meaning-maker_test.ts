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

import { MeaningMaker } from './meaning-maker.js';

async function initMM() {
  const meaningMaker = new MeaningMaker();
  await meaningMaker.init();
  meaningMaker.lastSeenTimeBuffer = 0;
  return meaningMaker;
}

describe('Meaning Maker', () => {
  it('loads from URLs', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.lengthOf(artifacts, 1);
  });

  it('handles bad loads from URLs', async () => {
    const meaningMaker = await initMM();
    try {
      await meaningMaker.loadArtifactsFromUrl(new URL('bad-url.html', window.location.href));
    } catch (err) {
      // This is a workaround sync assert.throws() doesn't handle async yet.
      // See: https://github.com/chaijs/chai/issues/415
      assert.throws(() => { throw err; });
    }
  });

  it('loads from supported origins', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts =
        await meaningMaker.loadArtifactsFromSupportedUrl(url, (url: URL) => {
          return url.origin === window.origin;
        });
    assert.lengthOf(artifacts, 1);
  });

  it('loads from same-origin if unspecified', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url);
    assert.lengthOf(artifacts, 1);
  });

  it('ignores unsupported origins', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts =
        await meaningMaker.loadArtifactsFromSupportedUrl(url, (url: URL) => {
          return false;
        });
    assert.lengthOf(artifacts, 0);
  });

  it('supports origins as strings', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url,
      [window.location.origin]);
    assert.lengthOf(artifacts, 1);
  });

  it('returns all Image Targets as detectableImages', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-image.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url);
    const images = (await meaningMaker.updatePerceptionState({})).detectableImages;
    assert.lengthOf(artifacts, 1, 'No artifacts');
    assert.lengthOf(images, 1, 'No image artifacts');
  });

  it('finds and loses markers', async () => {
    const meaningMaker = await initMM();
    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.lengthOf(artifacts, 1);

    const marker = {
      type: 'qr_code',
      value: '1234567890'
    };

    const foundResponse = await meaningMaker.updatePerceptionState({ markers: [ marker ] });
    assert.isDefined(foundResponse);
    assert.lengthOf(foundResponse.found, 1);
    assert.lengthOf(foundResponse.lost, 0);

    const lostResponse = await meaningMaker.updatePerceptionState({});
    assert.lengthOf(lostResponse.found, 0);
    assert.lengthOf(lostResponse.lost, 1);
  });

  it('finds and loses images', async () => {
    const meaningMaker = await initMM();
    const url = new URL('/base/test-assets/test-image.html', window.location.href);
    await meaningMaker.loadArtifactsFromUrl(url);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.lengthOf(artifacts, 1);

    const detectedImage = {
      id: 'Lighthouse'
    };

    const foundResponse = await meaningMaker.updatePerceptionState({ images: [ detectedImage ] });
    assert.isDefined(foundResponse);
    assert.lengthOf(foundResponse.found, 1);
    assert.lengthOf(foundResponse.lost, 0);

    const lostResponse = await meaningMaker.updatePerceptionState({});
    assert.lengthOf(lostResponse.found, 0);
    assert.lengthOf(lostResponse.lost, 1);
  });

  it.skip('loads markers dynamically', async () => {
    const meaningMaker = await initMM();
    const url = new URL('/base/test-assets/test-dynamic.html', window.location.href);
    // TODO: The following fails sometimes
    assert.equal(url.port, '9876');

    // Do not load artifact first.

    const marker = {
      type: 'qr_code',
      value: url.href
    };

    const foundResponse = await meaningMaker.updatePerceptionState({ markers: [ marker ] });
    assert.isDefined(foundResponse);
    assert.equal(foundResponse.found.length, 1);
    assert.equal(foundResponse.lost.length, 0);

    const loseRespones = await meaningMaker.updatePerceptionState({});
    assert.equal(loseRespones.found.length, 0);
    assert.equal(loseRespones.lost.length, 1);
  });

  it('accepts updated locations without any geofenced artifacts', async () => {
    // Location updates do not change results.
    const meaningMaker = await initMM();
    const url = new URL('/base/test-assets/test-barcode.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.lengthOf(artifacts, 1);

    const marker = {
      type: 'qr_code',
      value: '1234567890'
    };
    const geo = {
      latitude: 1,
      longitude: 1
    };

    // Add the marker.
    const foundResponse = await meaningMaker.updatePerceptionState({ markers: [ marker ] });
    assert.isDefined(foundResponse);
    assert.lengthOf(foundResponse.found, 1);
    assert.lengthOf(foundResponse.lost, 0);

    // Add the marker, alongside geo change
    const locationResponse = await meaningMaker.updatePerceptionState({ markers: [ marker ], geo });
    assert.isDefined(locationResponse);
    assert.lengthOf(locationResponse.found, 0);
    assert.lengthOf(locationResponse.lost, 0);
  });
});
