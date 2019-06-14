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

import { generateMarkerId } from './generate-marker-id.js';

describe('Generate Marker ID', () => {
  it('generates marker IDs', async () => {
    const id = generateMarkerId({ type: 'foo', value: 'bar' });
    assert.equal(id, 'foo__bar');
  });

  it('different marker types have different ids', async () => {
    const id1 = generateMarkerId({ type: 'barcode', value: 'bar' });
    const id2 = generateMarkerId({ type: 'qr_code', value: 'bar' });
    assert.notEqual(id1, id2);
  });
});
