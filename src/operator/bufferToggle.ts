import {Operator} from '../Operator';
import {Subscriber} from '../Subscriber';
import {Observable} from '../Observable';
import {Subscription} from '../Subscription';
import {tryCatch} from '../util/tryCatch';
import {errorObject} from '../util/errorObject';

/**
 * Buffers values from the source by opening the buffer via signals from an
 * Observable provided to `openings`, and closing and sending the buffers when
 * an Observable returned by the `closingSelector` emits.
 *
 * <img src="./img/bufferToggle.png" width="100%">
 *
 * @param {Observable<O>} openings An observable of notifications to start new
 * buffers.
 * @param {Function} closingSelector a function that takes the value emitted by
 * the `openings` observable and returns an Observable, which, when it emits,
 * signals that the associated buffer should be emitted and cleared.
 * @returns {Observable<T[]>} an observable of arrays of buffered values.
 */
export function bufferToggle<T, O>(openings: Observable<O>,
                                   closingSelector: (value: O) => Observable<any>): Observable<T[]> {
  return this.lift(new BufferToggleOperator(openings, closingSelector));
}

class BufferToggleOperator<T, O> implements Operator<T, T[]> {

  constructor(private openings: Observable<O>,
              private closingSelector: (value: O) => Observable<any>) {
  }

  call(subscriber: Subscriber<T[]>): Subscriber<T> {
    return new BufferToggleSubscriber(subscriber, this.openings, this.closingSelector);
  }
}

interface BufferContext<T> {
  buffer: T[];
  subscription: Subscription;
}

class BufferToggleSubscriber<T, O> extends Subscriber<T> {
  private contexts: Array<BufferContext<T>> = [];

  constructor(destination: Subscriber<T[]>,
              private openings: Observable<O>,
              private closingSelector: (value: O) => Observable<any>) {
    super(destination);
    this.add(this.openings.subscribe(new BufferToggleOpeningsSubscriber(this)));
  }

  protected _next(value: T) {
    const contexts = this.contexts;
    const len = contexts.length;
    for (let i = 0; i < len; i++) {
      contexts[i].buffer.push(value);
    }
  }

  protected _error(err: any) {
    const contexts = this.contexts;
    while (contexts.length > 0) {
      const context = contexts.shift();
      context.subscription.unsubscribe();
      context.buffer = null;
      context.subscription = null;
    }
    this.contexts = null;
    super._error(err);
  }

  protected _complete() {
    const contexts = this.contexts;
    while (contexts.length > 0) {
      const context = contexts.shift();
      this.destination.next(context.buffer);
      context.subscription.unsubscribe();
      context.buffer = null;
      context.subscription = null;
    }
    this.contexts = null;
    super._complete();
  }

  openBuffer(value: O) {
    const closingSelector = this.closingSelector;
    const contexts = this.contexts;

    let closingNotifier = tryCatch(closingSelector)(value);
    if (closingNotifier === errorObject) {
      this._error(errorObject.e);
    } else {
      let context = {
        buffer: <T[]>[],
        subscription: new Subscription()
      };
      contexts.push(context);
      const subscriber = new BufferToggleClosingsSubscriber<T>(this, context);
      const subscription = closingNotifier.subscribe(subscriber);
      context.subscription.add(subscription);
      this.add(subscription);
    }
  }

  closeBuffer(context: BufferContext<T>) {
    const contexts = this.contexts;
    if (contexts === null) {
      return;
    }
    const { buffer, subscription } = context;
    this.destination.next(buffer);
    contexts.splice(contexts.indexOf(context), 1);
    this.remove(subscription);
    subscription.unsubscribe();
  }
}

class BufferToggleOpeningsSubscriber<T, O> extends Subscriber<O> {
  constructor(private parent: BufferToggleSubscriber<T, O>) {
    super(null);
  }

  protected _next(value: O) {
    this.parent.openBuffer(value);
  }

  protected _error(err: any) {
    this.parent.error(err);
  }

  protected _complete() {
    // noop
  }
}

class BufferToggleClosingsSubscriber<T> extends Subscriber<any> {
  constructor(private parent: BufferToggleSubscriber<T, any>,
              private context: { subscription: any, buffer: T[] }) {
    super(null);
  }

  protected _next() {
    this.parent.closeBuffer(this.context);
  }

  protected _error(err: any) {
    this.parent.error(err);
  }

  protected _complete() {
    this.parent.closeBuffer(this.context);
  }
}
