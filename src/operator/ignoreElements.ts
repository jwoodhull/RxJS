import {Observable} from '../Observable';
import {Operator} from '../Operator';
import {Subscriber} from '../Subscriber';
import {noop} from '../util/noop';

/**
 * Ignores all items emitted by the source Observable and only passes calls of `complete` or `error`.
 *
 * <img src="./img/ignoreElements.png" width="100%">
 *
 * @returns {Observable} an empty Observable that only calls `complete`
 * or `error`, based on which one is called by the source Observable.
 */
export function ignoreElements<T>(): Observable<T> {
  return this.lift(new IgnoreElementsOperator());
};

class IgnoreElementsOperator<T, R> implements Operator<T, R> {
  call(subscriber: Subscriber<R>): Subscriber<T> {
    return new IgnoreElementsSubscriber(subscriber);
  }
}

class IgnoreElementsSubscriber<T> extends Subscriber<T> {
  protected _next(unused: T): void {
    noop();
  }
}
