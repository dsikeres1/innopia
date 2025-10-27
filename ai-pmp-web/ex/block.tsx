import { makeAutoObservable, runInAction } from "mobx";

class BlockModel {
  private counter = 0;

  constructor() {
    makeAutoObservable(this);
  }

  public get locked(): boolean {
    return this.counter > 0;
  }

  async with<T>(block: () => Promise<T>): Promise<T> {
    ++this.counter;
    try {
      return await block();
    } finally {
      runInAction(() => {
        --this.counter;
      });
    }
  }
}

export const blockModel = new BlockModel();