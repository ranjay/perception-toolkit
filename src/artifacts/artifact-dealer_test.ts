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

import { LocalArtifactStore } from './stores/local-artifact-store.js';

const { assert } = chai;

import { ArtifactDealer } from './artifact-dealer.js';
import { ArtifactStore } from './stores/artifact-store.js';

describe('ArtifactDealer', () => {
  let artDealer: ArtifactDealer;

  beforeEach(() => {
    artDealer = new ArtifactDealer();
    const store = new LocalArtifactStore();
    artDealer.addArtifactStore(store);

    store.addArtifact({
      arTarget: { '@type': 'Barcode', 'text': 'Barcode1' },
      arContent: 'Fake URL'
    });
    store.addArtifact({
      arTarget: [
        { '@type': 'Barcode', 'text': 'Barcode2' },
        { '@type': 'Unsupported' },
      ],
      arContent: 'Fake URL'
    });
    store.addArtifact({
      arTarget: [
        { '@type': 'Barcode', 'text': 'Barcode3' },
        { '@type': 'Barcode', 'text': 'Barcode4' },
        { '@type': 'Barcode', 'text': 'Barcode5' },
      ],
      arContent: 'Fake URL'
    });
    store.addArtifact({
      arTarget: {
        '@type': 'ARImageTarget',
        'name': 'Id1',
        'image': 'Fake URL'
      },
      arContent: 'Fake URL'
    });
    store.addArtifact({
      arTarget: {
        '@type': 'ARImageTarget',
        'name': 'Id2',
        'image': {
          '@type': 'ImageObject',
          'contentUrl': 'FakeUrl'
        }
      },
      arContent: 'Fake URL'
    });
    store.addArtifact({
      arTarget: {
        '@type': 'ARImageTarget',
        'name': 'Id3',
        'encoding': [{
          '@type': 'ImageObject',
          'contentUrl': 'FakeUrl'
        }]
      },
      arContent: 'Fake URL'
    });
  });

  it('Ignores unknown markers', async () => {
    const result = await artDealer.getPerceptionResults({
      markers: [{
        type: 'qrcode',
        value: 'Unknown Marker'
      }]
    });
    assert.isArray(result);
    assert.isEmpty(result);
  });

  it('Finds known barcodes', async () => {
    const result = await artDealer.getPerceptionResults({
      markers: [
        { type: 'qrcode', value: 'Barcode1' },
        { type: 'qrcode', value: 'Barcode2' },
        { type: 'qrcode', value: 'Barcode3' },
        { type: 'qrcode', value: 'Barcode4' },
        { type: 'qrcode', value: 'Barcode5' },
      ]
    });
    assert.isArray(result);
    assert.lengthOf(result, 5);
  });

  it('Predicts all detectableImages', async () => {
    const result = await artDealer.predictPerceptionTargets({});
    assert.isArray(result.detectableImages);
    assert.lengthOf(result.detectableImages, 3);
  });

  it('Finds known images', async () => {
    const result = await artDealer.getPerceptionResults({
      images: [
        { id: 'Id1' },
        { id: 'Id2' },
        { id: 'Id3' },
      ]
    });
    assert.isArray(result);
    assert.lengthOf(result, 3);
  });

  it('Ignores geolocation', async () => {
    const result = await artDealer.getPerceptionResults({ geo: {} });
    assert.isArray(result);
    assert.isEmpty(result);
  });

  it('Multiple stores all supply results', async () => {
    const otherStore = new LocalArtifactStore();
    artDealer.addArtifactStore(otherStore);

    otherStore.addArtifact({
      arTarget: { '@type': 'Barcode', 'text': 'OtherBarcode' },
      arContent: ''
    });
    otherStore.addArtifact({
      arTarget: {
        '@type': 'ARImageTarget',
        'name': 'OtherImage',
        'image': ''
      },
      arContent: ''
    });

    const result = await artDealer.getPerceptionResults({
      markers: [
        { type: 'qrcode', value: 'Barcode1' },
        { type: 'qrcode', value: 'OtherBarcode' }
      ],
      images: [
        { id: 'Id1' },
        { id: 'OtherImage' },
      ]
    });
    assert.isArray(result);
    assert.lengthOf(result, 4);
  });

  it('Unimplemented stores are ignored', async () => {
    const otherStore = {} as ArtifactStore;
    artDealer.addArtifactStore(otherStore);

    const result = await artDealer.getPerceptionResults({
      markers: [
        { type: 'qrcode', value: 'Barcode1' },
      ],
      images: [
        { id: 'Id1' },
      ]
    });
    assert.isArray(result);
    assert.lengthOf(result, 2);
  });
});
