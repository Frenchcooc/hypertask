"use strict";

import fetch from "node-fetch";
import { createHash, randomBytes } from "crypto";

enum TaskStatus {
  IDLE = "idle",
  BUSY = "busy",
  SUCCESS = "success",
  FAILURE = "failure",
}

interface TaskOptions {
  id?: string;
  delay?: number;
}

export class Hypertask {
  private _bucket: string = "";
  private _key: string = "";

  constructor(options?: { bucket?: string; key?: string }) {
    if (options && options.bucket) {
      this.bucket(options.bucket);
    }

    if (options && options.key) {
      this.key(options.key);
    }

    return this;
  }

  public bucket(bucket?: string): string {
    if (bucket) {
      this._bucket = bucket;
    }

    return this._bucket;
  }

  public key(key?: string): string {
    if (key) {
      this._key = key;
    }

    return this._key;
  }

  public task(options: TaskOptions) {
    return new Task(this, options);
  }
}

class Task {
  private _id: string;
  private _delay: number = 60;
  private _status: TaskStatus;
  private _hyper: Hypertask;

  constructor(hyper: Hypertask, options: TaskOptions) {
    this._id = this.generateId(options && options.id);
    this._hyper = hyper;
    this._status = TaskStatus.IDLE;

    if (options && options.delay) {
      this._delay = options && options.delay;
    }

    return this;
  }

  public id() {
    return this._id;
  }

  public delay(time?: number) {
    if (typeof time === "number") {
      this._delay = time;
    }

    return this._delay;
  }

  public status() {
    return this._status;
  }

  public bucket() {
    return this._hyper.bucket();
  }

  public start() {
    this._status = TaskStatus.BUSY;

    return this.makeRequest("/api/tasks/" + this.id(), {
      method: "PUT",
      body: JSON.stringify({
        bucket: this.bucket(),
        delay: this.delay(),
      }),
    });
  }

  public async close() {
    const status = this.status();

    if (status !== TaskStatus.BUSY && status !== TaskStatus.IDLE) {
      return;
    }

    return this.makeRequest("/api/tasks/" + this.id() + "/close", { method: "POST" }).then(
      (data: { status: TaskStatus }) => {
        this._status = data.status;
      }
    );
  }

  /**
   * Pseudo-random string generator
   * @source: https://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
   *
   * @return {String}
   */

  private generateId(id?: string): string {
    let hash = "";

    if (typeof id === "string" && id) {
      hash = createHash("sha1").update(id).digest("hex");
    } else {
      hash = randomBytes(64).toString("hex");
    }

    return hash.substring(0, 36);
  }

  /**
   * Make fetch requests
   */

  private makeRequest(path: string, options?: { method: "GET" | "POST" | "PUT"; body?: string }) {
    const baseUrl = "https://us-central1-hypertask.cloudfunctions.net";
    const auth = `Basic ${Buffer.from([this._hyper.key(), ":"].join("")).toString("base64")}`;

    return fetch(baseUrl + path, {
      ...options,
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());
  }
}

export default Hypertask;
