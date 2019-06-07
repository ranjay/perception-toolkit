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

export interface PrerunCallback {
  (): void;
}

export interface Module {
  // Expose the memory on this mock for testing purposes.
  __memory: ArrayBuffer | null;
  HEAPU8: Uint8Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;
  preRun: PrerunCallback[];
  _malloc(size: number): number | null;
  _free(ptr: number): void;
  _addObjectIndexWithId(objectId: number, size: number, indexPtr: number): void;
  _cancelObjectId(objectId: number): void;
  process(ptr: number): {
    size(): number;
    get(): {id: number};
  };
}

declare global {
  interface Window {
    Module: Module;
  }
}

export class ModuleMock implements Module {
  preRun: PrerunCallback[] = [];
  private memory!: ArrayBuffer | null;

  constructor(public invalidMalloc = false, public mallocOffset = 0) {}

  _malloc(size: number) {
    if (this.invalidMalloc) {
      return null;
    }

    this.memory = new ArrayBuffer(this.mallocOffset + size);
    return this.mallocOffset;
  }

  get HEAPU8() {
    return new Uint8Array(this.memory!);
  }

  get HEAPU32() {
    return new Uint32Array(this.memory!);
  }

  get HEAPF32() {
    return new Float32Array(this.memory!);
  }

  get HEAPF64() {
    return new Float64Array(this.memory!);
  }

  get __memory(): ArrayBuffer | null {
    return this.memory;
  }

  _free(_: number) {
    this.memory = null;
  }

  _addObjectIndexWithId(objectId: number, size: number, indexPtr: number) {
    // Stub.
  }

  _cancelObjectId(objectId: number) {
    // Stub.
  }

  process(_: number) {
    return {
      get: () => ({id: 1}),
      size: () => 1,
    };
  }
}
