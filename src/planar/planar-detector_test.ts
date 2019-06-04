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

import { spy } from 'sinon';
import { Module, ModuleMock, PrerunCallback } from './planar-defs.js';
import { PlanarTargetDetector } from './planar-detector.js';

declare global {
  interface Window {
    Module: Module;
  }
}

let preRunSpy: {
  getCalls(): Array<{ args: PrerunCallback[] }>
  restore(): void;
};
function processPreRuns() {
  const proxyCalls = preRunSpy.getCalls();
  if (proxyCalls.length === 0) {
    return;
  }

  for (const { args } of proxyCalls) {
    if (args.length === 0 || typeof args[0] !== 'function') {
      continue;
    }

    args[0].call(null);
  }
}

describe('PlanarImageDetector', () => {
  let detector: PlanarTargetDetector;
  beforeEach(() => {
    const mock = new ModuleMock();
    window.Module = mock;

    preRunSpy = spy(mock.preRun, 'push');
    detector = new PlanarTargetDetector();

    processPreRuns();
  });

  afterEach(() => {
    preRunSpy.restore();
  });

  it('processes data while initializing', () => {
    detector = new PlanarTargetDetector();
    const value = detector.process(new ImageData(1, 1), 1);
    assert.equal(value.size(), 0);
    assert.deepEqual(value.get(0), { id: 0 });
  });

  it('processes data', () => {
    const value = detector.process(new ImageData(1, 1), 1);
    assert.equal(value.size(), 1);
    assert.deepEqual(value.get(0), { id: 1 });
  });

  it('accepts objects with IDs', () => {
    assert.doesNotThrow(() => {
      detector.addDetectionWithId(100, new Uint8Array(1));
    });
  });

  it('accepts objects without IDs', () => {
    assert.doesNotThrow(() => {
      detector.addDetection(new Uint8Array(1));
    });
  });

  it('cancels object detection', () => {
    detector.addDetectionWithId(100, new Uint8Array(1));
    detector.cancelDetection(100);
  });
});
